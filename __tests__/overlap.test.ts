import { checkForOverlappingShifts } from '@/app/api/shifts/route';

// Mock prisma
jest.mock('@/lib/db', () => {
  const mockPrisma = {
    shift: {
      findMany: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

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
    require('@/lib/db').prisma.shift.findMany.mockResolvedValue([]);

    const result = await checkForOverlappingShifts(userId, eventId, start, end);

    expect(result).toEqual([]);
    expect(require('@/lib/db').prisma.shift.findMany).toHaveBeenCalledWith({
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
    require('@/lib/db').prisma.shift.findMany.mockResolvedValue([overlappingShift]);

    const result = await checkForOverlappingShifts(userId, eventId, start, end);

    expect(result).toEqual([overlappingShift]);
    expect(require('@/lib/db').prisma.shift.findMany).toHaveBeenCalled();
  });

  it('should exclude the shift itself when excludeShiftId is provided', async () => {
    const overlappingShift = {
      id: 'shift1',
      title: 'Existing Shift',
      start: new Date('2026-01-01T11:00:00Z'),
      end: new Date('2026-01-01T13:00:00Z'),
    };

    // Mock: when excludeShiftId is provided, we expect the function to filter out the shift,
    // so we mock the return value to be an empty array (as if the shift was excluded).
    require('@/lib/db').prisma.shift.findMany.mockResolvedValue([]);

    const result = await checkForOverlappingShifts(
      userId,
      eventId,
      start,
      end,
      'shift1' // exclude this shift
    );

    expect(result).toEqual([]);
    expect(require('@/lib/db').prisma.shift.findMany).toHaveBeenCalledWith({
      where: {
        eventId,
        id: { not: 'shift1' },
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
});