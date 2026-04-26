import { prisma } from '@/lib/db';

export async function checkForOverlappingShifts(userId: string, start: Date, end: Date) {
  return prisma.shift.findMany({
    where: {
      assignments: {
        some: {
          userId,
        },
      },
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
