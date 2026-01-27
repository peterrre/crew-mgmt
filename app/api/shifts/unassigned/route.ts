import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Returns unassigned or under-staffed shifts for availability matching
// Volunteers can see shifts that need helpers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all shifts from non-archived events with their assignments
    const allShifts = await prisma.shift.findMany({
      where: {
        event: {
          isArchived: false,
        },
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: true,
      },
      orderBy: {
        start: 'asc',
      },
    });

    // Filter to shifts that need helpers:
    // 1. Shifts with no assignments at all
    // 2. Shifts with fewer assignments than minHelpers
    // 3. Shifts that have space (not at maxHelpers if maxHelpers > 0)
    const shifts = allShifts
      .filter((shift) => {
        const currentAssignments = shift.assignments.length;

        // If there are no assignments, definitely needs helpers
        if (currentAssignments === 0) return true;

        // If below minimum required, needs helpers
        if (currentAssignments < shift.minHelpers) return true;

        // If maxHelpers is set and not reached, could use more helpers
        if (shift.maxHelpers > 0 && currentAssignments < shift.maxHelpers) return true;

        return false;
      })
      .map((shift) => ({
        id: shift.id,
        title: shift.title,
        start: shift.start,
        end: shift.end,
        minHelpers: shift.minHelpers,
        maxHelpers: shift.maxHelpers,
        currentHelpers: shift.assignments.length,
        helperId: shift.helperId, // Keep for backward compatibility
        eventId: shift.eventId,
        event: shift.event,
      }));

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('Error fetching unassigned shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}
