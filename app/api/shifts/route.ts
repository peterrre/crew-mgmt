import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    let shifts;

    if (userRole === 'ADMIN') {
      // Admin sees all shifts
      shifts = await prisma.shift.findMany({
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
        orderBy: {
          start: 'asc',
        },
      });
    } else {
      // Crew and Volunteers see only their own shifts
      shifts = await prisma.shift.findMany({
        where: {
          helperId: userId,
        },
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
        orderBy: {
          start: 'asc',
        },
      });
    }

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('Error fetching shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, start, end, helperId, eventId } = body;

    if (!title || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.create({
      data: {
        title,
        start: new Date(start),
        end: new Date(end),
        helperId: helperId || null,
        eventId: eventId || null,
      },
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

    return NextResponse.json({ shift }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift:', error);
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    );
  }
}

// Auto-assign shifts to available volunteers
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventId } = body;

    // Find unassigned shifts
    const unassignedShifts = await prisma.shift.findMany({
      where: {
        helperId: null,
        eventId: eventId || undefined,
      },
      orderBy: { start: 'asc' },
    });

    if (unassignedShifts.length === 0) {
      return NextResponse.json({ message: 'No unassigned shifts found' });
    }

    // Get all volunteers with their availability
    const volunteers = await prisma.user.findMany({
      where: { role: 'VOLUNTEER' },
      include: { availabilitySlots: true },
    });

    let assignments = 0;

    for (const shift of unassignedShifts) {
      // Find volunteers available for this shift
      const availableVolunteers = volunteers.filter(volunteer => {
        return volunteer.availabilitySlots.some((slot: any) => {
          const slotStart = new Date(slot.start);
          const slotEnd = new Date(slot.end);
          return shift.start >= slotStart && shift.end <= slotEnd;
        });
      });

      if (availableVolunteers.length > 0) {
        // Assign to first available volunteer (could be improved with scoring)
        await prisma.shift.update({
          where: { id: shift.id },
          data: { helperId: availableVolunteers[0].id },
        });
        assignments++;
      }
    }

    return NextResponse.json({ message: `Assigned ${assignments} shifts` });
  } catch (error) {
    console.error('Error auto-assigning shifts:', error);
    return NextResponse.json(
      { error: 'Failed to auto-assign shifts' },
      { status: 500 }
    );
  }
}
