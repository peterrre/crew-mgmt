import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/hours
 * Calculate total hours for a user or all users (Admin only for all users)
 * Query params: userId (optional), startDate, endDate (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const currentUserId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'hours';

    switch (reportType) {
      case 'hours':
        return await getHoursReport(
          searchParams,
          currentUserId,
          userRole
        );
      case 'event-statistics':
        if (userRole !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
        }
        return await getEventStatistics(searchParams);
      case 'upcoming-shifts':
        return await getUpcomingShifts(
          searchParams,
          currentUserId,
          userRole
        );
      case 'volunteer-availability':
        if (userRole !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Forbidden' },
            { status: 403 }
          );
        }
        return await getVolunteerAvailability(searchParams);
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function getHoursReport(
  searchParams: URLSearchParams,
  currentUserId: string,
  userRole: string
) {
  const targetUserId = searchParams.get('userId') || currentUserId;

  // Non-admins can only view their own hours
  if (userRole !== 'ADMIN' && targetUserId !== currentUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  const whereClause: any = {
    assignments: {
      some: {
        userId: targetUserId,
      },
    },
  };

  if (startDate || endDate) {
    whereClause.start = {};
    if (startDate) whereClause.start.gte = new Date(startDate);
    if (endDate) whereClause.start.lte = new Date(endDate);
  }

  const shifts = await prisma.shift.findMany({
    where: whereClause,
    include: {
      event: {
        select: {
          id: true,
          name: true,
        },
      },
      assignments: {
        where: {
          userId: targetUserId,
        },
      },
    },
    orderBy: {
      start: 'asc',
    },
  });

  // Calculate total hours
  let totalHours = 0;
  const shiftDetails = shifts.map((shift) => {
    const durationMs =
      new Date(shift.end).getTime() - new Date(shift.start).getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    totalHours += durationHours;

    return {
      id: shift.id,
      title: shift.title,
      eventName: shift.event.name,
      start: shift.start,
      end: shift.end,
      durationHours: Math.round(durationHours * 100) / 100,
      role: shift.assignments[0]?.role,
    };
  });

  return NextResponse.json({
    totalHours: Math.round(totalHours * 100) / 100,
    shiftCount: shifts.length,
    shifts: shiftDetails,
  });
}

async function getEventStatistics(searchParams: URLSearchParams) {
  const eventId = searchParams.get('eventId');

  let whereClause: any = {};
  if (eventId) {
    whereClause.id = eventId;
  }

  const events = await prisma.event.findMany({
    where: whereClause,
    include: {
      shifts: {
        include: {
          assignments: true,
        },
      },
      crew: true,
      volunteerApplications: true,
    },
  });

  const statistics = events.map((event) => {
    const totalShifts = event.shifts.length;
    const totalAssignments = event.shifts.reduce(
      (sum, shift) => sum + shift.assignments.length,
      0
    );
    const totalNeededAssignments = event.shifts.reduce(
      (sum, shift) => sum + shift.maxHelpers + 1, // +1 for responsible
      0
    );
    const filledPositions = event.shifts.filter(
      (shift) => shift.assignments.length >= shift.minHelpers
    ).length;

    // Calculate total volunteer hours
    const totalHours = event.shifts.reduce((sum, shift) => {
      const durationMs =
        new Date(shift.end).getTime() - new Date(shift.start).getTime();
      return sum + (durationMs / (1000 * 60 * 60)) * shift.assignments.length;
    }, 0);

    // Application statistics
    const pendingApplications = event.volunteerApplications.filter(
      (app) => app.status === 'PENDING'
    ).length;
    const approvedApplications = event.volunteerApplications.filter(
      (app) => app.status === 'APPROVED'
    ).length;
    const rejectedApplications = event.volunteerApplications.filter(
      (app) => app.status === 'REJECTED'
    ).length;

    return {
      eventId: event.id,
      eventName: event.name,
      totalShifts,
      filledPositions,
      totalAssignments,
      totalNeededAssignments,
      totalHours: Math.round(totalHours * 100) / 100,
      crewCount: event.crew.length,
      applicationStats: {
        total: event.volunteerApplications.length,
        pending: pendingApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
      },
    };
  });

  return NextResponse.json({
    events: statistics,
  });
}

async function getUpcomingShifts(
  searchParams: URLSearchParams,
  currentUserId: string,
  userRole: string
) {
  const now = new Date();
  const daysAhead = parseInt(searchParams.get('days') || '7', 10);
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  let whereClause: any = {
    start: {
      gte: now,
      lte: futureDate,
    },
  };

  if (userRole !== 'ADMIN') {
    // Non-admins see only their own shifts or shifts needing help in their events
    const userEventCrew = await prisma.eventCrew.findMany({
      where: { userId: currentUserId },
      select: { eventId: true },
    });
    const eventIds = userEventCrew.map((ec) => ec.eventId);

    whereClause.eventId = { in: eventIds };
  }

  const shifts = await prisma.shift.findMany({
    where: whereClause,
    include: {
      event: {
        select: {
          id: true,
          name: true,
        },
      },
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      start: 'asc',
    },
  });

  // For volunteers, show shifts needing help; for admin, show all
  let filteredShifts;
  if (userRole === 'ADMIN') {
    // Show shifts that need more helpers (below max) or have no responsible
    filteredShifts = shifts.filter((shift) => {
      const hasResponsible = shift.assignments.some(
        (a) => a.role === 'RESPONSIBLE'
      );
      const helperCount = shift.assignments.filter(
        (a) => a.role === 'HELPER'
      ).length;
      return !hasResponsible || helperCount < shift.minHelpers;
    });
  } else {
    // Show user's own upcoming shifts
    filteredShifts = shifts.filter((shift) =>
      shift.assignments.some((a) => a.userId === currentUserId)
    );
  }

  const formattedShifts = filteredShifts.map((shift) => ({
    id: shift.id,
    title: shift.title,
    eventName: shift.event.name,
    start: shift.start,
    end: shift.end,
    helperCount: shift.assignments.filter((a) => a.role === 'HELPER').length,
    minHelpers: shift.minHelpers,
    maxHelpers: shift.maxHelpers,
    hasResponsible: shift.assignments.some((a) => a.role === 'RESPONSIBLE'),
    assignments: shift.assignments.map((a) => ({
      userId: a.userId,
      userName: a.user.name,
      role: a.role,
    })),
  }));

  return NextResponse.json({
    shifts: formattedShifts,
    period: {
      from: now,
      to: futureDate,
      daysAhead,
    },
  });
}

async function getVolunteerAvailability(searchParams: URLSearchParams) {
  const now = new Date();
  const daysAhead = parseInt(searchParams.get('days') || '30', 10);
  const futureDate = new Date(now);
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const availabilitySlots = await prisma.availabilitySlot.findMany({
    where: {
      start: {
        gte: now,
        lte: futureDate,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      start: 'asc',
    },
  });

  // Group by date for easier viewing
  const groupedByDate = availabilitySlots.reduce(
    (acc: any, slot) => {
      const dateKey = new Date(slot.start).toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push({
        id: slot.id,
        userId: slot.userId,
        userName: slot.user.name,
        start: slot.start,
        end: slot.end,
        isRecurring: slot.isRecurring,
        recurrencePattern: slot.recurrencePattern,
      });
      return acc;
    },
    {}
  );

  return NextResponse.json({
    availabilitySlots: groupedByDate,
    totalSlots: availabilitySlots.length,
    period: {
      from: now,
      to: futureDate,
      daysAhead,
    },
  });
}
