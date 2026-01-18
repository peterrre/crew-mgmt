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

async function mergeAdjacentShifts(shiftId: string) {
  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
  });

  if (!shift || shift.helperId !== null) return;

  // Find all unassigned shifts with same title, ordered by start
  const adjacentShifts = await prisma.shift.findMany({
    where: {
      title: shift.title,
      helperId: null,
      eventId: shift.eventId,
    },
    orderBy: { start: 'asc' },
  });

  // Find the group that includes this shift
  const group: typeof adjacentShifts = [];
  let inGroup = false;
  for (const s of adjacentShifts) {
    if (s.id === shiftId) {
      inGroup = true;
      group.push(s);
    } else if (inGroup) {
      if (new Date(s.start).getTime() === new Date(group[group.length - 1].end).getTime()) {
        group.push(s);
      } else {
        break;
      }
    } else if (new Date(s.end).getTime() === new Date(shift.start).getTime()) {
      group.push(s);
      inGroup = true;
    }
  }

  if (group.length > 1) {
    // Merge: update the first to cover all, delete others
    const first = group[0];
    const last = group[group.length - 1];
    await prisma.shift.update({
      where: { id: first.id },
      data: { end: last.end },
    });
    for (let i = 1; i < group.length; i++) {
      await prisma.shift.delete({
        where: { id: group[i].id },
      });
    }
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, start, end, helperId, minHelpers, maxHelpers } = body;
    const { id } = await params;

    console.log('Received id:', id);

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (start !== undefined) updateData.start = new Date(start);
    if (end !== undefined) updateData.end = new Date(end);
    if (helperId !== undefined) updateData.helperId = helperId || null;
    if (minHelpers !== undefined) updateData.minHelpers = minHelpers;
    if (maxHelpers !== undefined) updateData.maxHelpers = maxHelpers;

    // Check if shift exists first
    const existingShift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!existingShift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      );
    }

    // If assigning a helper, verify they are in the event crew
    if (helperId && existingShift.eventId) {
      const eventCrew = await prisma.eventCrew.findUnique({
        where: {
          eventId_userId: {
            eventId: existingShift.eventId,
            userId: helperId,
          },
        },
      });

      if (!eventCrew) {
        return NextResponse.json(
          { error: 'Helper must be assigned to event crew first' },
          { status: 400 }
        );
      }
    }

    // If updating time, check for overlapping shifts for all assigned users
    if ((start !== undefined || end !== undefined) && existingShift.eventId) {
      const newStart = start ? new Date(start) : existingShift.start;
      const newEnd = end ? new Date(end) : existingShift.end;

      // Get all users assigned to this shift
      const assignments = await prisma.shiftAssignment.findMany({
        where: { shiftId: id },
        select: { userId: true, user: { select: { name: true, email: true } } },
      });

      const formatTime = (date: Date) => {
        return date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      };

      // Check each assigned user for overlaps
      for (const assignment of assignments) {
        const overlaps = await checkForOverlappingShifts(
          assignment.userId,
          existingShift.eventId,
          newStart,
          newEnd,
          id // Exclude current shift
        );

        if (overlaps.length > 0) {
          const userName = assignment.user.name || assignment.user.email;
          const conflictingShift = overlaps[0];

          return NextResponse.json(
            {
              error: `${userName} is already assigned to "${conflictingShift.title}" (${formatTime(conflictingShift.start)} - ${formatTime(conflictingShift.end)}) which would overlap with this updated time`,
            },
            { status: 400 }
          );
        }
      }
    }

    const shift = await prisma.shift.update({
      where: { id },
      data: updateData,
      include: {
        helper: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
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
      },
    });

    // If unassigning, try to merge with adjacent unassigned shifts
    if (helperId !== undefined && helperId === null) {
      await mergeAdjacentShifts(shift.id);
    }

    return NextResponse.json({ shift });
  } catch (error) {
    console.error('Error updating shift:', error);
    return NextResponse.json(
      { error: 'Failed to update shift' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if shift exists first
    const existingShift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!existingShift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      );
    }

    await prisma.shift.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shift:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift' },
      { status: 500 }
    );
  }
}
