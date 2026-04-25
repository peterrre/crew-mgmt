import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Check if a user has overlapping shift assignments for the given time range
 */
async function checkForOverlappingShifts(
  userId: string,
  eventId: string,
  start: Date,
  end: Date,
  excludeShiftId?: string
) {
  const overlappingShifts = await prisma.shift.findMany({
    where: {
      eventId,
      ...(excludeShiftId && { id: { not: excludeShiftId } }),
      assignments: {
        some: {
          userId: userId,
        },
      },
      OR: [
        {
          // New shift starts during existing shift
          AND: [
            { start: { lte: start } },
            { end: { gt: start } },
          ],
        },
        {
          // New shift ends during existing shift
          AND: [
            { start: { lt: end } },
            { end: { gte: end } },
          ],
        },
        {
          // New shift completely contains existing shift
          AND: [
            { start: { gte: start } },
            { end: { lte: end } },
          ],
        },
      ],
    },
    select: {
      id: true,
      title: true,
      start: true,
      end: true,
    },
  });

  return overlappingShifts;
}

/**
 * Verify user has permission to manage shift assignments
 * Returns true if user is Admin, Crew, or the current RESPONSIBLE of the shift
 */
async function canManageAssignments(
  shiftId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  // Admin and Crew can always manage
  if (userRole === 'ADMIN' || userRole === 'CREW') {
    return true;
  }

  // Otherwise, must be the current RESPONSIBLE of the shift
  const responsibleAssignment = await prisma.shiftAssignment.findFirst({
    where: {
      shiftId,
      userId,
      role: 'RESPONSIBLE',
    },
  });

  return !!responsibleAssignment;
}

/**
 * POST /api/shifts/[id]/assignments
 * Add a user as an assignment to a shift
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const currentUserId = (session.user as any).id;
    const shiftId = params.id;

    // Get shift details
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: true,
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Check if user has permission to manage this shift
    const hasPermission = await canManageAssignments(shiftId, currentUserId, userRole);
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this shift' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, role: requestedRole } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user is already assigned to this shift
    const existingAssignment = shift.assignments.find(
      (a) => a.userId === userId
    );

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User is already assigned to this shift' },
        { status: 400 }
      );
    }

    // Determine role: if no RESPONSIBLE exists, this user becomes RESPONSIBLE
    const hasResponsible = shift.assignments.some((a) => a.role === 'RESPONSIBLE');
    const role: 'RESPONSIBLE' | 'HELPER' =
      !hasResponsible || requestedRole === 'RESPONSIBLE' ? 'RESPONSIBLE' : 'HELPER';

    // If user explicitly requested RESPONSIBLE but one already exists, reject
    if (requestedRole === 'RESPONSIBLE' && hasResponsible) {
      return NextResponse.json(
        { error: 'This shift already has a responsible person' },
        { status: 400 }
      );
    }

    // Only Admin/Crew can assign RESPONSIBLE role
    if (role === 'RESPONSIBLE' && userRole === 'VOLUNTEER') {
      return NextResponse.json(
        { error: 'Only Admin or Crew can assign a responsible person' },
        { status: 403 }
      );
    }

    // Check max helpers limit
    const currentHelperCount = shift.assignments.filter(
      (a) => a.role === 'HELPER'
    ).length;

    if (role === 'HELPER' && currentHelperCount >= shift.maxHelpers) {
      return NextResponse.json(
        { error: 'Maximum number of helpers reached for this shift' },
        { status: 400 }
      );
    }

    // Check overlap for the user being assigned
    const overlappingShifts = await checkForOverlappingShifts(
      userId,
      shift.eventId,
      shift.start,
      shift.end,
      shiftId
    );

    if (overlappingShifts.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      const userName = user?.name || user?.email || 'User';
      const conflictingShift = overlappingShifts[0];

      const formatTime = (date: Date) => {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      };

      return NextResponse.json(
        {
          error: `${userName} is already assigned to "${conflictingShift.title}" (${formatTime(conflictingShift.start)} - ${formatTime(conflictingShift.end)}) which overlaps with this shift`,
          code: 'OVERLAP_CONFLICT',
        },
        { status: 400 }
      );
    }

    // Verify user is in event crew
    const eventCrewMember = await prisma.eventCrew.findUnique({
      where: {
        eventId_userId: {
          eventId: shift.eventId,
          userId,
        },
      },
    });

    if (!eventCrewMember) {
      return NextResponse.json(
        { error: 'User must be a crew member of the event first' },
        { status: 400 }
      );
    }

    // Create assignment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the assignment
      await tx.shiftAssignment.create({
        data: {
          shiftId,
          userId,
          role,
        },
      });

      // Update legacy helperId if this is a RESPONSIBLE assignment
      if (role === 'RESPONSIBLE') {
        await tx.shift.update({
          where: { id: shiftId },
          data: { helperId: userId },
        });
      }

      // Return updated shift
      return tx.shift.findUnique({
        where: { id: shiftId },
        include: {
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                },
              },
            },
            orderBy: {
              role: 'asc',
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              location: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ shift: result });
  } catch (error) {
    console.error('Error creating shift assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create shift assignment' },
      { status: 500 }
    );
  }
}
