import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    const now = new Date();

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const whereClause: any = {};
    if (startDate && endDate) {
      whereClause.start = {
        gte: startDate,
        lte: endDate,
      };
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        helper: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    const hoursMap = new Map<string, { name: string; role: string; hours: number }>();

    for (const shift of shifts) {
      if (!shift.helper) continue;

      const duration = (new Date(shift.end).getTime() - new Date(shift.start).getTime()) / (1000 * 60 * 60);

      if (hoursMap.has(shift.helper.id)) {
        const existing = hoursMap.get(shift.helper.id)!;
        existing.hours += duration;
      } else {
        hoursMap.set(shift.helper.id, {
          name: shift.helper.name || 'Unnamed',
          role: shift.helper.role,
          hours: duration,
        });
      }
    }

    const report = Array.from(hoursMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        role: data.role,
        hours: Math.round(data.hours * 100) / 100,
      }))
      .sort((a, b) => b.hours - a.hours);

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
