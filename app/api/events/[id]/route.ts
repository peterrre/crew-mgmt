import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/events/[id]
 * Get a specific event with details
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
    const userId = (session.user as any).id;
    const { id } = params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        shifts: {
          include: {
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
        },
        crew: {
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
        },
        contactPerson: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            volunteerApplications: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Non-admins can only view events they are part of
    if (userRole !== 'ADMIN') {
      const isInvolved =
        event.crew.some((c) => c.userId === userId) ||
        event.shifts.some((s) =>
          s.assignments.some((a) => a.userId === userId)
        );

      if (!isInvolved) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]
 * Update an event (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      name,
      description,
      startDate,
      endDate,
      location,
      acceptingVolunteers,
      contactPersonId,
      isArchived,
    } = body;

    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id },
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Validate dates if provided
    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate);
      if (isNaN(start.getTime())) {
        return NextResponse.json(
          { error: 'Invalid start date' },
          { status: 400 }
        );
      }
    }

    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date' },
          { status: 400 }
        );
      }
    }

    const finalStart = start || existingEvent.startDate;
    const finalEnd = end || existingEvent.endDate;

    if (finalEnd <= finalStart) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Validate contact person if provided
    if (contactPersonId) {
      const contactPerson = await prisma.user.findUnique({
        where: { id: contactPersonId },
      });

      if (!contactPerson) {
        return NextResponse.json(
          { error: 'Contact person not found' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (start) updateData.startDate = start;
    if (end) updateData.endDate = end;
    if (location !== undefined) updateData.location = location;
    if (acceptingVolunteers !== undefined)
      updateData.acceptingVolunteers = acceptingVolunteers;
    if (contactPersonId !== undefined) updateData.contactPersonId = contactPersonId;

    // Handle archiving
    if (isArchived !== undefined) {
      updateData.isArchived = isArchived;
      updateData.archivedAt = isArchived ? new Date() : null;
    }

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 * Delete an event (Admin only)
 * Uses soft delete via archiving if event has associated data
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            shifts: true,
            crew: true,
            volunteerApplications: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // If event has associated data, archive it instead of hard delete
    const hasAssociations =
      event._count.shifts > 0 ||
      event._count.crew > 0 ||
      event._count.volunteerApplications > 0;

    if (hasAssociations) {
      const updatedEvent = await prisma.event.update({
        where: { id },
        data: {
          isArchived: true,
          archivedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: 'Event archived due to existing associations',
        event: updatedEvent,
      });
    }

    // Hard delete if no associations
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
