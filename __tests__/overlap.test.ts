// Mock dependencies
jest.mock('@/lib/db');
const prismaMock = {
  shift: {
    findMany: jest.fn(),
  },
};

jest.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

import { prisma } from '@/lib/db';
import { checkForOverlappingShifts } from '@/lib/utils/overlap';

describe('checkForOverlappingShifts', () => {
  const userId = 'user1';
  const eventId = 'event1';
  const start = new Date('2026-01-01T10:00:00Z');
  const end = new Date('2026-01-01T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when no overlapping shifts', async () => {
    // Mock
    jest.mocked(prisma.shift.findMany).mockResolvedValue([]);

    const result = await checkForOverlappingShifts(userId, eventId, start, end);

    expect(result).toEqual([]);
    expect(prisma.shift.findMany).toHaveBeenCalledWith({
      where: {
        eventId,
        assignments: {
          some: {
            userId,
          },
        },
        OR: [
          {
            AND: [
              { start: { lte: start } },
              { end: { gt: start } },
            ],
          },
          {
            AND: [
              { start: { lt: end } },
              { end: { gte: end } },
            ],
          },
          {
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
  });

  it('should return overlapping shifts when there is an overlap', async () => {
    const overlappingShift = {
      id: 'shift1',
      title: 'Existing Shift',
      start: new Date('2026-01-01T11:00:00Z'),
      end: new Date('2026-01-01T13:00:00Z'),
    };

    // Mock
    jest.mocked(prisma.shift.findMany).mockResolvedValue([overlappingShift]);

    const result = await checkForOverlappingShifts(userId, eventId, start, end);

    expect(result).toEqual([overlappingShift]);
    expect(prisma.shift.findMany).toHaveBeenCalled();
  });
});
