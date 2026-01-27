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
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Count total shifts assigned to this user
    const totalShifts = await prisma.shiftAssignment.count({
      where: {
        userId: user.id,
      },
    });

    // Count upcoming shifts (future shifts)
    const upcomingShifts = await prisma.shiftAssignment.count({
      where: {
        userId: user.id,
        shift: {
          start: {
            gte: now,
          },
        },
      },
    });

    // Count shifts this month
    const shiftsThisMonth = await prisma.shiftAssignment.count({
      where: {
        userId: user.id,
        shift: {
          start: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
      },
    });

    // Calculate hours worked this month
    const shiftsWithDuration = await prisma.shiftAssignment.findMany({
      where: {
        userId: user.id,
        shift: {
          start: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
      },
      select: {
        shift: {
          select: {
            start: true,
            end: true,
          },
        },
      },
    });

    const hoursThisMonth = shiftsWithDuration.reduce((total, assignment) => {
      const duration = new Date(assignment.shift.end).getTime() - new Date(assignment.shift.start).getTime();
      return total + duration / (1000 * 60 * 60); // Convert ms to hours
    }, 0);

    // For volunteers: application statistics
    let applicationStats = null;
    if (user.role === 'VOLUNTEER') {
      const applications = await prisma.volunteerApplication.groupBy({
        by: ['status'],
        where: {
          userId: user.id,
        },
        _count: {
          status: true,
        },
      });

      applicationStats = {
        total: applications.reduce((sum, app) => sum + app._count.status, 0),
        pending: applications.find(a => a.status === 'PENDING')?._count.status || 0,
        approved: applications.find(a => a.status === 'APPROVED')?._count.status || 0,
        rejected: applications.find(a => a.status === 'REJECTED')?._count.status || 0,
      };
    }

    // Shifts by month for the last 6 months (for trend chart)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const shiftsByMonth: Record<string, number> = {};

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthKey = monthStart.toISOString().substring(0, 7); // YYYY-MM format

      const count = await prisma.shiftAssignment.count({
        where: {
          userId: user.id,
          shift: {
            start: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        },
      });

      shiftsByMonth[monthKey] = count;
    }

    // Convert to array and sort by date
    const shiftsActivity = Object.entries(shiftsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month,
        shifts: count,
      }));

    return NextResponse.json({
      totalShifts,
      upcomingShifts,
      shiftsThisMonth,
      hoursThisMonth: Math.round(hoursThisMonth * 10) / 10, // Round to 1 decimal
      applicationStats,
      shiftsActivity,
    });
  } catch (error) {
    console.error('Error fetching helper dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
