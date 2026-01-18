import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/available-events
 * Returns events that are accepting volunteers and that the current user
 * is not already assigned to or has a pending application for.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get events the user is already part of (via EventCrew)
    const existingAssignments = await prisma.eventCrew.findMany({
      where: { userId },
      select: { eventId: true },
    });
    const assignedEventIds = existingAssignments.map((ec) => ec.eventId);

    // Get events the user has pending applications for
    const pendingApplications = await prisma.volunteerApplication.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      select: { eventId: true },
    });
    const pendingEventIds = pendingApplications.map((app) => app.eventId);

    // Find available events
    const availableEvents = await prisma.event.findMany({
      where: {
        isArchived: false,
        acceptingVolunteers: true,
        // Future or ongoing events only
        endDate: {
          gte: new Date(),
        },
        // Exclude events user is already assigned to
        id: {
          notIn: assignedEventIds,
        },
      },
      include: {
        contactPerson: {
          select: { name: true, email: true },
        },
        _count: {
          select: {
            crew: true,
            shifts: true,
            volunteerApplications: {
              where: { status: 'PENDING' },
            },
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Add application status info to each event
    const eventsWithStatus = availableEvents.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      contactPerson: event.contactPerson,
      crewCount: event._count.crew,
      shiftsCount: event._count.shifts,
      pendingApplicationsCount: event._count.volunteerApplications,
      hasApplied: pendingEventIds.includes(event.id),
    }));

    return NextResponse.json({ events: eventsWithStatus });
  } catch (error) {
    console.error('Error fetching available events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available events' },
      { status: 500 }
    );
  }
}
