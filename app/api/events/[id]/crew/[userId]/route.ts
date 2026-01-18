import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId, userId } = params;

    // Check if crew assignment exists
    const eventCrew = await prisma.eventCrew.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!eventCrew) {
      return NextResponse.json(
        { error: 'Crew assignment not found' },
        { status: 404 }
      );
    }

    // Check if user has shifts in this event
    const shiftsCount = await prisma.shift.count({
      where: {
        eventId,
        helperId: userId,
      },
    });

    if (shiftsCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot remove crew member with assigned shifts',
          shiftsCount
        },
        { status: 400 }
      );
    }

    await prisma.eventCrew.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing crew from event:', error);
    return NextResponse.json(
      { error: 'Failed to remove crew from event' },
      { status: 500 }
    );
  }
}
