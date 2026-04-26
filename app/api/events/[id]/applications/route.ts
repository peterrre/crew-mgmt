import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[id]/applications
 * List all applications for a specific event (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const eventId = params.id;

    // Only admin can list applications for an event
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get query parameters for filtering and pagination
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { eventId };
    if (status) {
      where.status = status;
    }

    // Get applications and total count
    const [applications, total] = await prisma.$transaction([
      prisma.volunteerApplication.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.volunteerApplication.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching volunteer applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events/[id]/applications
 * Submit a new volunteer application for an event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only volunteers can apply
    const userRole = (session.user as any).role;
    if (userRole !== 'VOLUNTEER') {
      return NextResponse.json(
        { error: 'Only volunteers can apply for events' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;
    const eventId = params.id;

    const body = await request.json();
    const { message } = body;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event is accepting volunteers
    if (!event.acceptingVolunteers) {
      return NextResponse.json(
        { error: 'This event is not accepting volunteer applications' },
        { status: 400 }
      );
    }

    // Check if event is archived
    if (event.isArchived) {
      return NextResponse.json(
        { error: 'Cannot apply to an archived event' },
        { status: 400 }
      );
    }

    // Check if event is in the past
    if (event.endDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot apply to a past event' },
        { status: 400 }
      );
    }

    // Check if user is already in event crew
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

    // Check if user already has an application for this event
    const existingApplication = await prisma.volunteerApplication.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingApplication) {
      // If the application is pending or approved, we cannot apply again
      if (
        existingApplication.status === 'PENDING' ||
        existingApplication.status === 'APPROVED'
      ) {
        return NextResponse.json(
          { error: 'You already have an application for this event' },
          { status: 400 }
        );
      }
      // If rejected or withdrawn, we allow reapplication by updating the existing record
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