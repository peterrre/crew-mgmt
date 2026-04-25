import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/available
 * Returns events that are accepting volunteer applications
 * - Filters out archived events and past events
 * - Excludes events where user is already crew or has an application
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Admins and Crew see all available events (for management purposes)
    // Volunteers see only events they haven't applied to
    const now = new Date();

    // Get user's existing applications and crew memberships
    const [existingApplications, existingCrew] = await Promise.all([
      prisma.volunteerApplication.findMany({
        where: { userId },
        select: { eventId: true },
      }),
      prisma.eventCrew.findMany({
        where: { userId },
        select: { eventId: true },
      }),
    ]);

    const appliedEventIds = new Set(existingApplications.map((a) => a.eventId));
    const crewEventIds = new Set(existingCrew.map((c) => c.eventId));

    // Build where clause
    const whereClause: any = {
      acceptingVolunteers: true,
      isArchived: false,
      endDate: { gte: now },
    };

    // For volunteers, exclude events they're already part of
    if (userRole === 'VOLUNTEER') {
      whereClause.NOT = {
        OR: [
          { id: { in: Array.from(appliedEventIds) } },
          { id: { in: Array.from(crewEventIds) } },
        ],
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        location: true,
        acceptingVolunteers: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching available events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available events' },
      { status: 500 }
    );
  }
}
