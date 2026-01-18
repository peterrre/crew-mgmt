import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/my-events
 * Returns events the current user is assigned to via EventCrew,
 * along with their shift counts for each event.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Find all events the user is assigned to via EventCrew
    const eventCrewAssignments = await prisma.eventCrew.findMany({
      where: {
        userId,
      },
      include: {
        event: {
          include: {
            shifts: {
              include: {
                assignments: {
                  where: {
                    userId,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Transform the data
    const events = eventCrewAssignments
      .filter((ec) => !ec.event.isArchived) // Exclude archived events
      .map((ec) => {
        const event = ec.event;
        // Count shifts where user is assigned (via ShiftAssignment or legacy helperId)
        const myShiftsCount = event.shifts.filter(
          (shift) =>
            shift.assignments.length > 0 || shift.helperId === userId
        ).length;

        return {
          id: event.id,
          name: event.name,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          totalShiftsCount: event.shifts.length,
          myShiftsCount,
        };
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching my events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
