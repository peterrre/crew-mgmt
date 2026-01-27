import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get current date for filtering
    const now = new Date();

    // Application status breakdown
    const applicationStats = await prisma.volunteerApplication.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Upcoming events (next 30 days)
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
        isArchived: false,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        _count: {
          select: {
            crew: true,
            shifts: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: 10,
    });

    // Role distribution
    const roleStats = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true,
      },
    });

    // Recent activity - shift assignments in last 7 days
    const recentAssignments = await prisma.shiftAssignment.findMany({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      select: {
        createdAt: true,
        shift: {
          select: {
            event: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group assignments by date for activity chart
    const assignmentsByDate: Record<string, number> = {};
    recentAssignments.forEach((assignment) => {
      const date = assignment.createdAt.toISOString().split('T')[0];
      assignmentsByDate[date] = (assignmentsByDate[date] || 0) + 1;
    });

    // Shift request status breakdown
    const requestStats = await prisma.shiftRequest.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
    });

    // Format data for charts
    const applicationChartData = applicationStats.map((stat) => ({
      status: stat.status,
      count: stat._count.status,
    }));

    const roleChartData = roleStats.map((stat) => ({
      role: stat.role,
      count: stat._count.role,
    }));

    const requestChartData = requestStats.map((stat) => ({
      status: stat.status,
      count: stat._count.status,
    }));

    const activityChartData = Object.entries(assignmentsByDate).map(([date, count]) => ({
      date,
      assignments: count,
    }));

    const eventsTimelineData = upcomingEvents.map((event) => ({
      id: event.id,
      name: event.name,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      crewCount: event._count.crew,
      shiftsCount: event._count.shifts,
    }));

    return NextResponse.json({
      applications: applicationChartData,
      roles: roleChartData,
      requests: requestChartData,
      activity: activityChartData,
      upcomingEvents: eventsTimelineData,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
