import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const userRole = (session.user as any).role;

    // Only admins can view shift requests
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all shift requests for this event
    const requests = await prisma.shiftRequest.findMany({
      where: {
        eventId,
      },
      include: {
        shift: {
          select: {
            id: true,
            title: true,
            start: true,
            end: true,
          },
        },
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
        newHelper: {
          select: { id: true, name: true, email: true, role: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching event shift requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift requests' },
      { status: 500 }
    );
  }
}
