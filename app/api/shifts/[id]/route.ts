import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

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
    const { title, start, end, helperId } = body;
    const { id } = await params;

    console.log('Received id:', id);

    const updateData: any = {};

    if (title !== undefined) updateData.title = title;
    if (start !== undefined) updateData.start = new Date(start);
    if (end !== undefined) updateData.end = new Date(end);
    if (helperId !== undefined) updateData.helperId = helperId || null;

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
