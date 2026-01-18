import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: eventId, requestId } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Missing status field' },
        { status: 400 }
      );
    }

    // Verify the request exists and belongs to this event
    const shiftRequest = await prisma.shiftRequest.findUnique({
      where: { id: requestId },
      include: { shift: true },
    });

    if (!shiftRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (shiftRequest.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Request does not belong to this event' },
        { status: 400 }
      );
    }

    // Update request status
    const updatedRequest = await prisma.shiftRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewedBy: (session.user as any).id,
        reviewedAt: new Date(),
      },
      include: {
        shift: {
          select: {
            id: true,
            title: true,
            start: true,
            end: true,
          },
        },
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
        newHelper: {
          select: { id: true, name: true, email: true, role: true },
        },
        reviewer: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // If approved, apply the changes to the shift
    if (status === 'APPROVED') {
      if (shiftRequest.type === 'CANCEL') {
        await prisma.shift.update({
          where: { id: shiftRequest.shiftId },
          data: { helperId: null },
        });
      } else if (shiftRequest.type === 'SWAP' && shiftRequest.newHelperId) {
        await prisma.shift.update({
          where: { id: shiftRequest.shiftId },
          data: { helperId: shiftRequest.newHelperId },
        });
      } else if (
        shiftRequest.type === 'MODIFY' &&
        shiftRequest.newStart &&
        shiftRequest.newEnd
      ) {
        await prisma.shift.update({
          where: { id: shiftRequest.shiftId },
          data: {
            start: shiftRequest.newStart,
            end: shiftRequest.newEnd,
          },
        });
      }
    }

    // Prepare success message based on action
    const actionMessages = {
      APPROVED: {
        CANCEL: `Request approved: Shift "${updatedRequest.shift.title}" has been unassigned`,
        SWAP: `Request approved: Shift "${updatedRequest.shift.title}" has been reassigned`,
        MODIFY: `Request approved: Shift "${updatedRequest.shift.title}" times have been updated`,
      },
      REJECTED: {
        CANCEL: `Request rejected: Shift "${updatedRequest.shift.title}" remains assigned`,
        SWAP: `Request rejected: Shift "${updatedRequest.shift.title}" assignment unchanged`,
        MODIFY: `Request rejected: Shift "${updatedRequest.shift.title}" times unchanged`,
      },
    };

    const message =
      actionMessages[status as 'APPROVED' | 'REJECTED']?.[
        shiftRequest.type as 'CANCEL' | 'SWAP' | 'MODIFY'
      ] || `Request ${status.toLowerCase()}`;

    return NextResponse.json({
      request: updatedRequest,
      success: true,
      message,
    });
  } catch (error) {
    console.error('Error updating shift request:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Shift not found')) {
        return NextResponse.json(
          { error: 'The shift associated with this request no longer exists', success: false },
          { status: 404 }
        );
      }
      if (error.message.includes('User not found')) {
        return NextResponse.json(
          { error: 'The user associated with this request no longer exists', success: false },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update shift request. Please try again.', success: false },
      { status: 500 }
    );
  }
}
