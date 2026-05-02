import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { User } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get shift requests
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as User;
    const userRole = user.role;
    const userId = user.id;

    let requests;

    if (userRole === 'ADMIN') {
      // Admins see all requests
      requests = await prisma.shiftRequest.findMany({
        include: {
          shift: {
            select: { id: true, title: true, start: true, end: true },
          },
          requester: {
            select: { id: true, name: true, email: true },
          },
          newHelper: {
            select: { id: true, name: true, email: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Users see their own requests
      requests = await prisma.shiftRequest.findMany({
        where: { requesterId: userId },
        include: {
          shift: {
            select: { id: true, title: true, start: true, end: true },
          },
          requester: {
            select: { id: true, name: true, email: true },
          },
          newHelper: {
            select: { id: true, name: true, email: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching shift requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift requests' },
      { status: 500 }
    );
  }
}

// Create shift request
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { shiftId, type, reason, newHelperId, newStart, newEnd } = body;

    if (!shiftId || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the shift belongs to the user (unless admin)
    const user = session.user as User;
    const userRole = user.role;
    const userId = user.id;

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: { helperId: true, eventId: true },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    if (userRole !== 'ADMIN' && shift.helperId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (type === 'CANCEL') {
      // For cancel requests, immediately update the shift and create approved request for tracking
      await prisma.shift.update({
        where: { id: shiftId },
        data: { helperId: null },
      });

      const shiftRequest = await prisma.shiftRequest.create({
        data: {
          shiftId,
          eventId: shift.eventId,
          requesterId: userId,
          type,
          status: 'APPROVED', // Immediately approved for cancel
          reason,
          reviewedBy: userId, // Self-approved
          reviewedAt: new Date(),
        },
        include: {
          shift: {
            include: {
              helper: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          requester: {
            select: { id: true, name: true, email: true },
          },
          newHelper: {
            select: { id: true, name: true, email: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return NextResponse.json({ request: shiftRequest }, { status: 201 });
    } else {
      // For swap and modify requests, create pending request
      const shiftRequest = await prisma.shiftRequest.create({
        data: {
          shiftId,
          eventId: shift.eventId,
          requesterId: userId,
          type,
          reason,
          newHelperId: newHelperId || null,
          newStart: newStart ? new Date(newStart) : null,
          newEnd: newEnd ? new Date(newEnd) : null,
        },
        include: {
          shift: {
            include: {
              helper: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          requester: {
            select: { id: true, name: true, email: true },
          },
          newHelper: {
            select: { id: true, name: true, email: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return NextResponse.json({ request: shiftRequest }, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating shift request:', error);
    return NextResponse.json(
      { error: 'Failed to create shift request' },
      { status: 500 }
    );
  }
}

// Get available helpers for swap request
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as User;
    const userId = user.id;

    const body = await request.json();
    const { shiftId } = body;

    if (!shiftId) {
      return NextResponse.json({ error: 'Shift ID required' }, { status: 400 });
    }

    // Get the shift
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: { start: true, end: true },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Get all volunteers with their availability
    const volunteers = await prisma.user.findMany({
      where: { role: 'VOLUNTEER' },
      include: {
        availabilitySlots: {
          select: {
            start: true,
            end: true,
          },
        },
      },
    });

    // Filter volunteers who are available during the shift time and exclude the current user
    const availableVolunteers = volunteers.filter((volunteer) => {
      if (volunteer.id === userId) return false; // Exclude the requester themselves
      return volunteer.availabilitySlots.some((slot) => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        return shift.start >= slotStart && shift.end <= slotEnd;
      });
    });

    return NextResponse.json({ helpers: availableVolunteers });
  } catch (error) {
    console.error('Error fetching available helpers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available helpers' },
      { status: 500 }
    );
  }
}

// DEPRECATED: Use event-scoped API endpoint instead: /api/events/[id]/shift-requests/[requestId]
// This endpoint now returns 405 Method Not Allowed to enforce event-centric architecture
export async function PATCH() {
  return NextResponse.json(
    {
      error: 'Method not allowed. Use event-scoped endpoint: /api/events/[eventId]/shift-requests/[requestId]',
      deprecationNotice: 'This endpoint has been deprecated in favor of event-centric request management.',
    },
    {
      status: 405,
      headers: {
        Allow: 'GET, POST, PUT',
      },
    }
  );
}