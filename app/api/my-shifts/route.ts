import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/my-shifts
 *
 * Returns shifts assigned to the currently authenticated user.
 * Supports filtering by time range, status (upcoming/past), and pagination.
 *
 * Query Parameters:
 * - from: ISO date string (optional) - Start of date range
 * - to: ISO date string (optional) - End of date range
 * - status: 'upcoming' | 'past' | 'all' (default: 'all')
 * - page: number (default: 1) - Pagination page
 * - limit: number (default: 20) - Items per page (max: 100)
 * - sort: 'asc' | 'desc' (default: 'asc') - Sort by shift start time
 *
 * Response: { shifts: [...], total: number, page: number, pages: number }
 *
 * Permissions: User must be authenticated. Users can only see their own shifts.
 *              Admins/Crew can optionally pass ?userId= to query other users.
 *              (userId param only allowed for ADMIN/CREW roles)
 */

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.enum(['upcoming', 'past', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['asc', 'desc']).default('asc'),
  userId: z.string().cuid().optional(), // Admin/crew only
});

// Type for a shift with rich relations based on the include below
type MyShiftPayload = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  eventId: string;
  helperId: string | null;
  createdAt: Date;
  updatedAt: Date;
  event: {
    id: string;
    name: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    location: string | null;
  };
  assignments: Array<{
    id: string;
    role: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Session user with role populated by next-auth callback
    const authUserId = (session.user as { id: string; role: string }).id;
    const authUserRole = (session.user as { id: string; role: string }).role;

    // Parse & validate query params
    const url = new URL(request.url);
    const rawParams = Object.fromEntries(url.searchParams.entries());
    const parseResult = querySchema.safeParse(rawParams);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return NextResponse.json(
        { error: 'Invalid query parameter', detail: firstError.message, field: firstError.path.join('.') },
        { status: 400 }
      );
    }

    const { from, to, status, page, limit, sort, userId: requestedUserId } = parseResult.data;

    // Authorization: If userId is passed, caller must be ADMIN or CREW (not VOLUNTEER)
    let targetUserId = authUserId;
    if (requestedUserId) {
      if (authUserRole === 'VOLUNTEER') {
        return NextResponse.json(
          { error: 'Forbidden', detail: "Volunteers cannot query other users' shifts" },
          { status: 403 }
        );
      }
      targetUserId = requestedUserId;
    }

    // Build date filter conditions
    const now = new Date();
    const dateConditions: Array<Record<string, unknown>> = [];

    if (from) {
      dateConditions.push({ start: { gte: new Date(from) } });
    }
    if (to) {
      dateConditions.push({ start: { lte: new Date(to) } });
    }
    if (status === 'upcoming') {
      dateConditions.push({ end: { gte: now } });
    }
    if (status === 'past') {
      dateConditions.push({ end: { lt: now } });
    }

    // Also include OR-filter for backward-compat legacy helperId
    // This preserves existing shift data that hasn't migrated to ShiftAssignment yet
    const whereWithLegacyFallback = {
      AND: [
        {
          OR: [
            { assignments: { some: { userId: targetUserId } } },
            { helperId: targetUserId },
          ],
        },
        ...(dateConditions.length > 0 ? dateConditions : []),
      ],
    };

    // Count total (with legacy fallback for accurate pagination)
    const total = await prisma.shift.count({
      where: whereWithLegacyFallback,
    });

    const skip = (page - 1) * limit;

    // Fetch shifts with rich relations
    const shifts = await prisma.shift.findMany({
      where: whereWithLegacyFallback,
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
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
        start: sort,
      },
      take: limit,
      skip,
    }) as MyShiftPayload[];

    // Transform to clean response shape
    const transformedShifts = shifts.map((shift) => {
      const myAssignment = shift.assignments.find((a) => a.userId === targetUserId);
      const legacyRole = shift.helperId === targetUserId ? 'HELPER' : undefined;

      return {
        id: shift.id,
        title: shift.title,
        start: shift.start.toISOString(),
        end: shift.end.toISOString(),
        duration: Math.round((shift.end.getTime() - shift.start.getTime()) / (1000 * 60)), // minutes
        event: {
          id: shift.event.id,
          name: shift.event.name,
          description: shift.event.description,
          startDate: shift.event.startDate.toISOString(),
          endDate: shift.event.endDate.toISOString(),
          location: shift.event.location,
        },
        role: (myAssignment?.role ?? legacyRole ?? 'HELPER') as 'RESPONSIBLE' | 'HELPER',
        teammates: shift.assignments
          .filter((a) => a.userId !== targetUserId)
          .map((a) => ({
            userId: a.userId,
            name: a.user.name,
            email: a.user.email,
            role: a.role,
          })),
      };
    });

    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      shifts: transformedShifts,
      total,
      page,
      pages,
      limit,
    });
  } catch (error) {
    console.error('Error fetching my shifts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
}
