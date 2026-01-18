import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/volunteer-applications/[id]
 * Get a specific application
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

    const { id } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const application = await prisma.volunteerApplication.findUnique({
      where: { id },
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
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Non-admins can only view their own applications
    if (userRole !== 'ADMIN' && application.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/volunteer-applications/[id]
 * Update application status (approve/reject by admin, or withdraw by user)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;
    const body = await request.json();
    const { status, reviewNote } = body;

    const application = await prisma.volunteerApplication.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Only pending applications can be updated
    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending applications can be updated' },
        { status: 400 }
      );
    }

    // Validate allowed status transitions
    const allowedStatuses = ['APPROVED', 'REJECTED', 'WITHDRAWN'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED, REJECTED, or WITHDRAWN' },
        { status: 400 }
      );
    }

    // Users can only withdraw their own applications
    if (status === 'WITHDRAWN') {
      if (application.userId !== userId) {
        return NextResponse.json(
          { error: 'You can only withdraw your own applications' },
          { status: 403 }
        );
      }

      const updated = await prisma.volunteerApplication.update({
        where: { id },
        data: {
          status: 'WITHDRAWN',
          reviewedAt: new Date(),
        },
        include: {
          event: { select: { id: true, name: true } },
        },
      });

      return NextResponse.json({ application: updated });
    }

    // Only admins can approve/reject
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can approve or reject applications' },
        { status: 403 }
      );
    }

    // Handle approval - also create EventCrew entry
    if (status === 'APPROVED') {
      const result = await prisma.$transaction(async (tx) => {
        // Update application
        const updatedApplication = await tx.volunteerApplication.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewedBy: userId,
            reviewedAt: new Date(),
            reviewNote,
          },
          include: {
            event: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        });

        // Add user to event crew
        await tx.eventCrew.create({
          data: {
            eventId: application.eventId,
            userId: application.userId,
          },
        });

        return updatedApplication;
      });

      return NextResponse.json({ application: result });
    }

    // Handle rejection
    if (status === 'REJECTED') {
      const updated = await prisma.volunteerApplication.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewNote,
        },
        include: {
          event: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });

      return NextResponse.json({ application: updated });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/volunteer-applications/[id]
 * Delete an application (only by the applicant if pending, or by admin)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    const application = await prisma.volunteerApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Admins can delete any application
    if (userRole === 'ADMIN') {
      await prisma.volunteerApplication.delete({
        where: { id },
      });
      return NextResponse.json({ success: true });
    }

    // Users can only delete their own pending applications
    if (application.userId !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own applications' },
        { status: 403 }
      );
    }

    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending applications can be deleted' },
        { status: 400 }
      );
    }

    await prisma.volunteerApplication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}
