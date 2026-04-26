import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { User } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * DELETE /api/shifts/[id]/assignments/[userId]
 * Remove an assignment for a user from a shift.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as User;
    const userId = user.id;
    const userRole = user.role;

    const shiftId = params.id;
    const targetUserId = params.userId;

    // Fetch the shift to check existence and get minHelpers for validation
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: { id: true, minHelpers: true, helperId: true },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Fetch the assignment to be deleted
    const assignment = await prisma.shiftAssignment.findUnique({
      where: { shiftId_userId: { shiftId, userId: targetUserId } },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Permission check:
    // - Admin and Crew can always remove any assignment.
    // - The RESPONSIBLE of the shift can remove any assignment (including their own? The skill says: Allow self-removal unconditionally, but require canManageAssignments for removing others.)
    //   However, note: the skill says "Allow self-removal unconditionally", meaning a user can always remove their own assignment.
    //   For removing someone else's assignment, we require the current user to be able to manage assignments (i.e., ADMIN, CREW, or RESPONSIBLE).
    if (userId !== targetUserId) {
      // If the user is trying to remove someone else's assignment, we need to check permissions
      if (!(userRole === 'ADMIN' || userRole === 'CREW')) {
        // Check if the current user is the RESPONSIBLE for this shift
        const isResponsible = await prisma.shiftAssignment.findFirst({
          where: { shiftId, userId, role: 'RESPONSIBLE' },
        });
        if (!isResponsible) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      }
    }
    // If the user is removing their own assignment, we allow it unconditionally (as per skill).

    // Check if removing this assignment would violate the minHelpers constraint.
    // We only count HELPER roles toward the minHelpers? The skill does not specify.
    // We'll assume minHelpers applies to the number of HELPER assignments (as we did for maxHelpers in POST).
    // However, note: the RESPONSIBLE is not counted in minHelpers/maxHelpers? The legacy helperId is deprecated.
    // We'll follow the same logic as in POST: we only count HELPER roles for min/max limits.
    if (assignment.role === 'HELPER') {
      // Count current helpers (excluding the one we are about to remove)
      const currentHelpersCount = await prisma.shiftAssignment.count({
        where: { shiftId, role: 'HELPER' },
      });
      const newHelpersCount = currentHelpersCount - 1; // because we are removing one helper
      if (newHelpersCount < shift.minHelpers) {
        return NextResponse.json(
          { error: 'BELOW_MIN_HELPERS', message: `Removing this assignment would drop below the minimum required helpers (${shift.minHelpers})` },
          { status: 409 }
        );
      }
    }

    // If the assignment to delete is the RESPONSIBLE, we need to handle the legacy helperId.
    // We will clear the helperId (set to null) because we are removing the responsible.
    // Note: The skill says: On DELETE of RESPONSIBLE: Promote another RESPONSIBLE to helperId, or clear it to null if none remains.
    // However, we don't have a mechanism to promote another RESPONSIBLE because we only allow one RESPONSIBLE (by the unique constraint on role? Actually, we don't have a constraint that there can be only one RESPONSIBLE per shift, but we check in POST that there isn't already one).
    // So when we delete the RESPONSIBLE, there will be no other RESPONSIBLE. We'll set helperId to null.
    // But note: the skill says "Promote another RESPONSIBLE to helperId" - but we don't have another. So we set to null.

    // Run the deletion in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the assignment
      await tx.shiftAssignment.delete({
        where: { shiftId_userId: { shiftId, userId: targetUserId } },
      });

      // If we deleted the RESPONSIBLE, clear the legacy helperId
      if (assignment.role === 'RESPONSIBLE') {
        await tx.shift.update({
          where: { id: shiftId },
          data: { helperId: null },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting shift assignment:', error);
    return NextResponse.json(
      { error: 'Failed to delete shift assignment' },
      { status: 500 }
    );
  }
}