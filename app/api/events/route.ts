import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events
 * List events based on user role:
 * - ADMIN: All events with optional filters
 * - CREW/VOLUNTEER: Events they are involved in (crew member, shifts, or applications)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('archived') === 'true';
    const upcoming = searchParams.get('upcoming') === 'true';

    let whereClause: any = {};

    if (userRole === 'ADMIN') {
      // Admin can filter by archived status
      if (!includeArchived) {
        whereClause.isArchived = false;
      }

      // Filter for upcoming events only
      if (upcoming) {
        whereClause.endDate = { gte: new Date() };
      }
    } else {
      // Non-admins: only events they are involved in
      // Get user's event IDs from various sources
      const [crewEvents, shiftEvents, applicationEvents] = await Promise.all([
        prisma.eventCrew.findMany({
          where: { userId },
          select: { eventId: true },
        }),
        prisma.shiftAssignment.findMany({
          where: { userId },
          include: {
            shift: {
              select: { eventId: true },
            },
          },
        }),
        prisma.volunteerApplication.findMany({
          where: { userId },
          select: { eventId: true },
        }),
      ]);

      const eventIds = new Set([
        ...crewEvents.map((e) => e.eventId),
        ...shiftEvents.map((s) => s.shift.eventId),
        ...applicationEvents.map((a) => a.eventId),
      ]);

      whereClause = {
        id: { in: Array.from(eventIds) },
        isArchived: false,
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            shifts: true,
            crew: true,
            volunteerApplications: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      startDate,
      endDate,
      location,
      acceptingVolunteers = false,
      contactPersonId,
    } = body;

    // Validation
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, startDate, and endDate are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate contact person if provided
    if (contactPersonId) {
      const contactPerson = await prisma.user.findUnique({
        where: { id: contactPersonId },
      });

      if (!contactPerson) {
        return NextResponse.json(
          { error: 'Contact person not found' },
          { status: 400 }
        );
      }
    }

    const event = await prisma.event.create({
      data: {
        name,
        description,
        startDate: start,
        endDate: end,
        location,
        acceptingVolunteers,
        contactPersonId,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
