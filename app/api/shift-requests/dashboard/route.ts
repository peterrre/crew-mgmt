import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get dashboard statistics and events with pending requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all shift requests with counts
    const [allRequests, todayRequests, weekRequests] = await Promise.all([
      prisma.shiftRequest.count({
        where: { status: 'PENDING' },
      }),
      prisma.shiftRequest.count({
        where: {
          status: 'PENDING',
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.shiftRequest.count({
        where: {
          status: 'PENDING',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get events with pending requests
    const eventsWithRequests = await prisma.event.findMany({
      where: {
        shiftRequests: {
          some: {
            status: 'PENDING',
          },
        },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        location: true,
        _count: {
          select: {
            shiftRequests: {
              where: {
                status: 'PENDING',
              },
            },
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    // Get recent activity (last 10 processed requests)
    const recentActivity = await prisma.shiftRequest.findMany({
      where: {
        status: {
          in: ['APPROVED', 'REJECTED'],
        },
      },
      select: {
        id: true,
        type: true,
        status: true,
        reviewedAt: true,
        shift: {
          select: {
            title: true,
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        requester: {
          select: {
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        reviewedAt: 'desc',
      },
      take: 10,
    });

    return NextResponse.json({
      stats: {
        pending: allRequests,
        today: todayRequests,
        week: weekRequests,
      },
      eventsWithRequests,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
