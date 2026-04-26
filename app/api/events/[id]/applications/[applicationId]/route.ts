import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/db'

interface AuthUser {
  id: string
  role: string
}

export const dynamic = 'force-dynamic'

/**
 * PATCH /api/events/[id]/applications/[applicationId]
 * Update application status (approve/reject by admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUser = session.user as AuthUser
    const userRole = authUser.role
    const userId = authUser.id
    const { id: eventId, applicationId } = params

    // Only admin can update application status
    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { status, reviewNote } = body

    // Validate status
    if (!status || (status !== 'APPROVED' && status !== 'REJECTED')) {
      return NextResponse.json(
        { error: 'Status must be either APPROVED or REJECTED' },
        { status: 400 }
      )
    }

    // Find the application
    const application = await prisma.volunteerApplication.findUnique({
      where: { id: applicationId },
      include: {
        event: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Ensure the application belongs to the event in the URL
    if (application.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Application does not belong to this event' },
        { status: 400 }
      )
    }

    // Only pending applications can be updated
    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending applications can be updated' },
        { status: 400 }
      )
    }

    // Update the application
    const updatedApplication = await prisma.volunteerApplication.update({
      where: { id: applicationId },
      data: {
        status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNote: reviewNote ?? null,
      },
      include: {
        event: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // If approved, add user to event crew
    if (status === 'APPROVED') {
      await prisma.eventCrew.create({
        data: {
          eventId: application.eventId,
          userId: application.userId,
        },
        // Ignore if already exists (duplicate key)
        // In a real app, we might want to check first, but for now we rely on unique constraint
        // and catch the error if needed. However, we can use upsert or check first.
        // Let's check first to avoid error.
      }).catch(async (error) => {
        // If the error is a unique constraint violation, we can ignore it
        if (error.code === 'P2002') {
          // Already exists, ignore
          return
        }
        // Otherwise, rethrow
        throw error
      })
    }

    return NextResponse.json({ application: updatedApplication })
  } catch (error) {
    console.error('Error updating volunteer application:', error)
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/events/[id]/applications/[applicationId]
 * Withdraw an application (set status to WITHDRAWN) by the applicant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; applicationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUser = session.user as AuthUser
    const userId = authUser.id
    const { id: eventId, applicationId } = params

    // Find the application
    const application = await prisma.volunteerApplication.findUnique({
      where: { id: applicationId },
      include: {
        event: true,
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Ensure the application belongs to the event in the URL
    if (application.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Application does not belong to this event' },
        { status: 400 }
      )
    }

    // Only the applicant can withdraw their own application
    if (application.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only pending applications can be withdrawn
    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending applications can be withdrawn' },
        { status: 400 }
      )
    }

    // Update application status to WITHDRAWN
    const updatedApplication = await prisma.volunteerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'WITHDRAWN',
        reviewedAt: new Date(), // Optional, but we can set it to indicate when withdrawn
        // Note: We don't set reviewedBy because it's the user withdrawing, not an admin reviewing
        // We can leave reviewedBy as null, or set it to the userId? The skill doesn't specify.
        // We'll leave it as null to indicate no admin review.
        reviewNote: null,
      },
    })

    return NextResponse.json({ application: updatedApplication })
  } catch (error) {
    console.error('Error withdrawing volunteer application:', error)
    return NextResponse.json(
      { error: 'Failed to withdraw application' },
      { status: 500 }
    )
  }
}