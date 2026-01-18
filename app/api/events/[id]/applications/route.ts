import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[id]/applications
 * Get all volunteer applications for a specific event (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can view event applications' },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Check event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, acceptingVolunteers: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const whereClause: any = { eventId };
    if (status) {
      whereClause.status = status;
    }

    const applications = await prisma.volunteerApplication.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      event,
      applications,
    });
  } catch (error) {
    console.error('Error fetching event applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
