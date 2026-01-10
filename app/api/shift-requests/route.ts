import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    let requests;

    if (userRole === 'ADMIN') {
      // Admins see all requests
      requests = await prisma.shiftRequest.findMany({
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
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Users see their own requests
      requests = await prisma.shiftRequest.findMany({
        where: { requesterId: userId },
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
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: { helperId: true },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    if (userRole !== 'ADMIN' && shift.helperId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shiftRequest = await prisma.shiftRequest.create({
      data: {
        shiftId,
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
      },
    });

    return NextResponse.json({ request: shiftRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift request:', error);
    return NextResponse.json(
      { error: 'Failed to create shift request' },
      { status: 500 }
    );
  }
}

// Review shift request (admin only)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, status, reason } = body;

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const shiftRequest = await prisma.shiftRequest.findUnique({
      where: { id: requestId },
      include: { shift: true },
    });

    if (!shiftRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
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

    // If approved, apply the changes
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
      } else if (shiftRequest.type === 'MODIFY' && shiftRequest.newStart && shiftRequest.newEnd) {
        await prisma.shift.update({
          where: { id: shiftRequest.shiftId },
          data: {
            start: shiftRequest.newStart,
            end: shiftRequest.newEnd,
          },
        });
      }
    }

    return NextResponse.json({ request: updatedRequest });
  } catch (error) {
    console.error('Error reviewing shift request:', error);
    return NextResponse.json(
      { error: 'Failed to review shift request' },
      { status: 500 }
    );
  }
}