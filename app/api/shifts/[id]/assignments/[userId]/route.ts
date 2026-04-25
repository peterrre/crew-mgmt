import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Verify user has permission to manage shift assignments
 * Returns true if user is Admin, Crew, or the current RESPONSIBLE of the shift
 */
async function canManageAssignments(
  shiftId: string,
  userId: string,
  userRole: string
): Promise<boolean> {
  // Admin and Crew can always manage
  if (userRole === 'ADMIN' || userRole === 'CREW') {
    return true;
  }

  // Otherwise, must be the current RESPONSIBLE of the shift
  const responsibleAssignment = await prisma.shiftAssignment.findFirst({
    where: {
      shiftId,
      userId,
      role: 'RESPONSIBLE',
    },
  });

  return !!responsibleAssignment;
}

/**
 * DELETE /api/shifts/[id]/assignments/[userId]
 * Remove a user from a shift assignment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const currentUserId = (session.user as any).id;
    const shiftId = params.id;
    const targetUserId = params.userId;

    // Get shift with assignments
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: true,
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Find the assignment to delete
    const assignmentToDelete = shift.assignments.find(
      (a) => a.userId === targetUserId
    );

    if (!assignmentToDelete) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Permission checks:
    // 1. Users can always remove their own assignment
    // 2. Admin/Crew/Responsible can remove others
    const isSelfRemoval = currentUserId === targetUserId;
    const canManage = await canManageAssignments(shiftId, currentUserId, userRole);

    if (!isSelfRemoval && !canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this assignment' },
        { status: 403 }
      );
    }

    // Check min helpers limit after removal (only if removing a HELPER)
    if (assignmentToDelete.role === 'HELPER') {
      const currentHelperCount = shift.assignments.filter(
        (a) => a.role === 'HELPER'
      ).length;

      if (currentHelperCount <= shift.minHelpers) {
        return NextResponse.json(
          {
            error: 'Cannot remove helper: minimum number of helpers required',
            code: 'BELOW_MIN_HELPERS',
          },
          { status: 400 }
        );
      }
    }

    // If removing the RESPONSIBLE, check if another RESPONSIBLE would remain
    // (or allow if Admin/Crew is doing it and will reassign later)
    if (assignmentToDelete.role === 'RESPONSIBLE') {
      const otherResponsible = shift.assignments.find(
        (a) => a.userId !== targetUserId && a.role === 'RESPONSIBLE'
      );

      if (!otherResponsible && !canManage) {
        return NextResponse.json(
          {
            error: 'Cannot remove the only responsible person without admin permission',
            code: 'RESPONSIBLE_REQUIRED',
          },
          { status: 400 }
        );
      }
    }

    // Delete assignment in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete the assignment
      await tx.shiftAssignment.delete({
        where: {
          id: assignmentToDelete.id,
        },
      });

      // Update legacy helperId if removing the RESPONSIBLE
      // Find another RESPONSIBLE to promote, or clear helperId if none
      if (assignmentToDelete.role === 'RESPONSIBLE') {
        const nextResponsible = shift.assignments.find(
          (a) => a.userId !== targetUserId && a.role === 'RESPONSIBLE'
        );

        if (nextResponsible) {
          // Promote another RESPONSIBLE to legacy helperId
          await tx.shift.update({
            where: { id: shiftId },
            data: { helperId: nextResponsible.userId },
          });
        } else {
          // Clear legacy helperId if no RESPONSIBLE remains
          await tx.shift.update({
            where: { id: shiftId },
            data: { helperId: null },
          });
        }
      }

      // Return updated shift
      return tx.shift.findUnique({
        where: { id: shiftId },
        include: {
          assignments: {
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
              role: 'asc',
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              location: true,
            },
          },
        },
      });
    });

    return NextResponse.json({ shift: result });
  } catch (error) {
    console.error('Error deleting shift assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift assignment' },
      { status: 500 }
    );
  }
}
