import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/volunteer-applications
 * Returns applications based on user role:
 * - ADMIN: All applications (with optional eventId filter)
 * - Others: Only their own applications
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');

    const whereClause: any = {};

    // Non-admins can only see their own applications
    if (userRole !== 'ADMIN') {
      whereClause.userId = userId;
    }

    // Filter by event if specified
    if (eventId) {
      whereClause.eventId = eventId;
    }

    // Filter by status if specified
    if (status) {
      whereClause.status = status;
    }

    const applications = await prisma.volunteerApplication.findMany({
      where: whereClause,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
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
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('Error fetching volunteer applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/volunteer-applications
 * Submit a new volunteer application
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { eventId, message } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if event exists and is accepting volunteers
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.isArchived) {
      return NextResponse.json(
        { error: 'Cannot apply to an archived event' },
        { status: 400 }
      );
    }

    if (!event.acceptingVolunteers) {
      return NextResponse.json(
        { error: 'This event is not accepting volunteer applications' },
        { status: 400 }
      );
    }

    if (event.endDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot apply to a past event' },
        { status: 400 }
      );
    }

    // Check if user is already assigned to this event
    const existingCrew = await prisma.eventCrew.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingCrew) {
      return NextResponse.json(
        { error: 'You are already assigned to this event' },
        { status: 400 }
      );
    }

    // Check if user already has a pending or approved application
    const existingApplication = await prisma.volunteerApplication.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingApplication) {
      if (existingApplication.status === 'PENDING') {
        return NextResponse.json(
          { error: 'You already have a pending application for this event' },
          { status: 400 }
        );
      }
      if (existingApplication.status === 'APPROVED') {
        return NextResponse.json(
          { error: 'Your application was already approved' },
          { status: 400 }
        );
      }
      // If rejected or withdrawn, allow reapplication by updating the existing record
      const updatedApplication = await prisma.volunteerApplication.update({
        where: { id: existingApplication.id },
        data: {
          status: 'PENDING',
          message,
          reviewedBy: null,
          reviewedAt: null,
          reviewNote: null,
        },
        include: {
          event: {
            select: { id: true, name: true },
          },
        },
      });

      return NextResponse.json({ application: updatedApplication });
    }

    // Create new application
    const application = await prisma.volunteerApplication.create({
      data: {
        eventId,
        userId,
        message,
      },
      include: {
        event: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error creating volunteer application:', error);
    return NextResponse.json(
      { error: 'Failed to create application' },
      { status: 500 }
    );
  }
}
