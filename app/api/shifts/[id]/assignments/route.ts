import { NextResponse } from 'next/server';
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
 * GET /api/shifts/:id/assignments
 * List all assignments for a shift
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: shiftId } = await params;

    const shift = await prisma.shift.findUnique({
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
            role: 'asc', // RESPONSIBLE comes before HELPER
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    return NextResponse.json({
      assignments: shift.assignments,
      minHelpers: shift.minHelpers,
      maxHelpers: shift.maxHelpers,
    });
  } catch (error) {
    console.error('Error fetching shift assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shifts/:id/assignments
 * Add a new assignment to a shift
 *
 * Permission: ADMIN can always add, RESPONSIBLE person can add HELPERS
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const currentUserRole = (session.user as any).role;
    const { id: shiftId } = await params;

    const body = await request.json();
    const { userId, role = 'HELPER' } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get shift with current assignments
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: true,
        event: true,
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Check permissions
    const isAdmin = currentUserRole === 'ADMIN';
    const isResponsible = shift.assignments.some(
      (a) => a.userId === currentUserId && a.role === 'RESPONSIBLE'
    );

    // Only ADMIN can set RESPONSIBLE role
    if (role === 'RESPONSIBLE' && !isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can assign the RESPONSIBLE role' },
        { status: 403 }
      );
    }

    // ADMIN or RESPONSIBLE can add HELPERS
    if (!isAdmin && !isResponsible) {
      return NextResponse.json(
        { error: 'Only admins or the responsible person can add helpers' },
        { status: 403 }
      );
    }

    // Check if user is already assigned
    const existingAssignment = shift.assignments.find((a) => a.userId === userId);
    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User is already assigned to this shift' },
        { status: 400 }
      );
    }

    // Check max helpers limit
    if (shift.maxHelpers && shift.assignments.length >= shift.maxHelpers) {
      return NextResponse.json(
        { error: `Maximum number of helpers (${shift.maxHelpers}) already assigned` },
        { status: 400 }
      );
    }

    // Verify user is in event crew
    const eventCrew = await prisma.eventCrew.findUnique({
      where: {
        eventId_userId: {
          eventId: shift.eventId,
          userId,
        },
      },
    });

    if (!eventCrew) {
      return NextResponse.json(
        { error: 'User must be assigned to event crew first' },
        { status: 400 }
      );
    }

    // Check for overlapping shift assignments for the same user
    const overlappingShifts = await checkForOverlappingShifts(
      userId,
      shift.eventId,
      shift.start,
      shift.end,
      shift.id // Exclude the current shift
    );

    if (overlappingShifts.length > 0) {
      const conflictingShift = overlappingShifts[0];
      const formatTime = (date: Date) => {
        return new Date(date).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      };

      return NextResponse.json(
        {
          error: `User is already assigned to "${conflictingShift.title}" (${formatTime(conflictingShift.start)} - ${formatTime(conflictingShift.end)}) which overlaps with this shift`,
        },
        { status: 400 }
      );
    }

    // Create the assignment
    const assignment = await prisma.$transaction(async (tx) => {
      const newAssignment = await tx.shiftAssignment.create({
        data: {
          shiftId,
          userId,
          role: role as 'RESPONSIBLE' | 'HELPER',
        },
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
      });

      // Update legacy helperId for backward compatibility (only for RESPONSIBLE)
      if (role === 'RESPONSIBLE') {
        await tx.shift.update({
          where: { id: shiftId },
          data: { helperId: userId },
        });
      }

      return newAssignment;
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shifts/:id/assignments
 * Remove an assignment from a shift
 *
 * Body: { assignmentId: string } or { userId: string }
 *
 * Permission:
 * - ADMIN can remove anyone
 * - RESPONSIBLE can remove HELPERS (not self)
 * - HELPER can remove only self
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const currentUserRole = (session.user as any).role;
    const { id: shiftId } = await params;

    const body = await request.json();
    const { assignmentId, userId: targetUserId } = body;

    if (!assignmentId && !targetUserId) {
      return NextResponse.json(
        { error: 'assignmentId or userId is required' },
        { status: 400 }
      );
    }

    // Get shift with assignments
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: true,
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Find the assignment to delete
    const assignmentToDelete = assignmentId
      ? shift.assignments.find((a) => a.id === assignmentId)
      : shift.assignments.find((a) => a.userId === targetUserId);

    if (!assignmentToDelete) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = currentUserRole === 'ADMIN';
    const isResponsible = shift.assignments.some(
      (a) => a.userId === currentUserId && a.role === 'RESPONSIBLE'
    );
    const isRemovingSelf = assignmentToDelete.userId === currentUserId;

    // Permission check
    if (!isAdmin) {
      if (assignmentToDelete.role === 'RESPONSIBLE') {
        // Only admin can remove RESPONSIBLE
        return NextResponse.json(
          { error: 'Only admins can remove the responsible person' },
          { status: 403 }
        );
      }

      if (!isResponsible && !isRemovingSelf) {
        // HELPER can only remove self
        return NextResponse.json(
          { error: 'You can only remove yourself from this shift' },
          { status: 403 }
        );
      }
    }

    // Prevent removing the only RESPONSIBLE if there are still HELPERS
    if (assignmentToDelete.role === 'RESPONSIBLE') {
      const hasHelpers = shift.assignments.some(
        (a) => a.role === 'HELPER'
      );
      if (hasHelpers) {
        return NextResponse.json(
          { error: 'Cannot remove responsible person while helpers are assigned. Remove helpers first or assign a new responsible person.' },
          { status: 400 }
        );
      }
    }

    // Delete the assignment
    await prisma.$transaction(async (tx) => {
      await tx.shiftAssignment.delete({
        where: { id: assignmentToDelete.id },
      });

      // Update legacy helperId if removing RESPONSIBLE
      if (assignmentToDelete.role === 'RESPONSIBLE') {
        await tx.shift.update({
          where: { id: shiftId },
          data: { helperId: null },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shift assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    );
  }
}
