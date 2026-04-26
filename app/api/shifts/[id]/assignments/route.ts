import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { User } from '@prisma/client';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

/**
 * Check for overlapping shifts for a given user and time range.
 * We consider a shift overlapping if it has any time in common with the new shift.
 * Note: This function is called with the shift's start and end times.
 */
async function checkForOverlappingShifts(
  userId: string,
  start: Date,
  end: Date
) {
  return await prisma.shift.findMany({
    where: {
      assignments: {
        some: {
          userId,
        },
      },
      // Overlap condition: existing shift start < new end AND existing shift end > new start
      start: { lt: end },
      end: { gt: start },
    },
    select: {
      id: true,
      title: true,
      start: true,
      end: true,
    },
  });
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/shifts/[id]/assignments
 * Returns the current assignments for a shift, including the RESPONSIBLE and HELPERS.
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shiftId = params.id;

    // Fetch the shift with its assignments and the helperId (legacy) for reference
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Separate RESPONSIBLE and HELPERS
    const responsible = shift.assignments.find(
      (a) => a.role === 'RESPONSIBLE'
    );
    const helpers = shift.assignments.filter(
      (a) => a.role === 'HELPER'
    );

    return NextResponse.json({
      responsible: responsible
        ? {
            userId: responsible.userId,
            name: responsible.user?.name,
            role: responsible.role,
          }
        : null,
      helpers: helpers.map((h) => ({
        userId: h.userId,
        name: h.user?.name,
        role: h.role,
      })),
      counts: {
        current: shift.assignments.length,
        min: shift.minHelpers,
        max: shift.maxHelpers,
      },
    });
  } catch (error) {
    console.error('Error fetching shift assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shift assignments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shifts/[id]/assignments
 * Assign a user to a shift with a specified role (RESPONSIBLE or HELPER).
 * Expects JSON: { userId: string, role: 'RESPONSIBLE' | 'HELPER' }
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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
    const body = await request.json();
    const { userId: targetUserId, role } = body;

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and role' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'RESPONSIBLE' && role !== 'HELPER') {
      return NextResponse.json(
        { error: "Role must be either 'RESPONSIBLE' or 'HELPER'" },
        { status: 400 }
      );
    }

    // Fetch the shift to check existence and get timing for overlap check
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: { id: true, start: true, end: true, minHelpers: true, maxHelpers: true, helperId: true },
    });

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }

    // Permission check: only ADMIN, CREW, or the existing RESPONSIBLE can assign roles
    // Note: For assigning a RESPONSIBLE, we must be ADMIN or CREW (since only they can set the responsible)
    // For assigning a HELPER, we can be ADMIN, CREW, or the RESPONSIBLE of the shift.
    if (!(userRole === 'ADMIN' || userRole === 'CREW')) {
      // Check if the current user is the RESPONSIBLE for this shift
      const isResponsible = await prisma.shiftAssignment.findFirst({
        where: { shiftId, userId, role: 'RESPONSIBLE' },
      });
      if (!isResponsible) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // If we are the RESPONSIBLE, we can only assign HELPER (not RESPONSIBLE)
      if (role === 'RESPONSIBLE') {
        return NextResponse.json(
          { error: 'Only ADMIN or CREW can assign a RESPONSIBLE' },
          { status: 403 }
        );
      }
    }

    // Overlap check: prevent assigning a user to overlapping shifts
    const overlappingShifts = await checkForOverlappingShifts(
      targetUserId,
      shift.start,
      shift.end
    );
    if (overlappingShifts.length > 0) {
      const conflicting = overlappingShifts[0];
      return NextResponse.json(
        {
          error: 'OVERLAP_CONFLICT',
          message: `User is already assigned to overlapping shift: ${conflicting.title}`,
          conflictingShift: {
            id: conflicting.id,
            title: conflicting.title,
            start: conflicting.start,
            end: conflicting.end,
          },
        },
        { status: 409 }
      );
    }

    // Check if the user is already assigned to this shift (any role)
    const existingAssignment = await prisma.shiftAssignment.findFirst({
      where: { shiftId, userId: targetUserId },
    });
    if (existingAssignment) {
      return NextResponse.json(
        { error: 'User is already assigned to this shift' },
        { status: 409 }
      );
    }

    // If assigning a RESPONSIBLE, check that there isn't already one
    if (role === 'RESPONSIBLE') {
      const existingResponsible = await prisma.shiftAssignment.findFirst({
        where: { shiftId, role: 'RESPONSIBLE' },
      });
      if (existingResponsible) {
        return NextResponse.json(
          { error: 'RESPONSIBLE_EXISTS', message: 'A responsible person is already assigned' },
          { status: 409 }
        );
      }
    }

    // Check max helpers limit (only for HELPER role; RESPONSIBLE doesn't count toward helper limit?)
    // According to the schema, minHelpers and maxHelpers are for helpers (not including the responsible?).
    // We'll interpret minHelpers and maxHelpers as applying to the number of HELPER assignments.
    if (role === 'HELPER') {
      const currentHelpers = await prisma.shiftAssignment.count({
        where: { shiftId, role: 'HELPER' },
      });
      if (currentHelpers >= shift.maxHelpers) {
        return NextResponse.json(
          { error: 'MAX_HELPERS_REACHED', message: `Maximum number of helpers (${shift.maxHelpers}) reached` },
          { status: 409 }
        );
      }
    }

    // Run the assignment in a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the assignment
      const assignment = await tx.shiftAssignment.create({
        data: {
          shiftId,
          userId: targetUserId,
          role,
        },
      });

      // If we are assigning a RESPONSIBLE, update the legacy helperId field (for backward compatibility)
      if (role === 'RESPONSIBLE') {
        await tx.shift.update({
          where: { id: shiftId },
          data: { helperId: targetUserId },
        });
      }

      return assignment;
    });

    return NextResponse.json({ assignment: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating shift assignment:', error);
    return NextResponse.json(
      { error: 'Failed to create shift assignment' },
      { status: 500 }
    );
  }
}