import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Returns unassigned shifts for availability matching
// Volunteers can see unassigned shifts to know what they could be assigned to
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unassigned shifts from non-archived events
    const shifts = await prisma.shift.findMany({
      where: {
        helperId: null,
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
      },
      orderBy: {
        start: 'asc',
      },
    });

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error('Error fetching unassigned shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}
