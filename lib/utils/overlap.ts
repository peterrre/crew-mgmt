import { prisma } from '@/lib/db';

/**
 * Check if a user has overlapping shift assignments for the given time range
 */
export async function checkForOverlappingShifts(
  userId: string,
  eventId: string,
  start: Date,
  end: Date,
  excludeShiftId?: string
) {
  const overlappingShifts = await prisma.shift.findMany({
    where: {
      eventId,
      ...(excludeShiftId && { id: { not: excludeShiftId } }),
      assignments: {
        some: {
          userId: userId,
        },
      },
      OR: [
        {
          // New shift starts during existing shift
          AND: [
            { start: { lte: start } },
            { end: { gt: start } },
          ],
        },
        {
          // New shift ends during existing shift
          AND: [
            { start: { lt: end } },
            { end: { gte: end } },
          ],
        },
        {
          // New shift completely contains existing shift
          AND: [
            { start: { gte: start } },
            { end: { lte: end } },
          ],
        },
      ],
    },
    select: {
      id: true,
      title: true,
      start: true,
      end: true,
    },
  });

  return overlappingShifts;
}