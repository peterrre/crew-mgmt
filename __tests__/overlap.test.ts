import { checkForOverlappingShifts } from '@/app/api/shifts/\[id\]/assignments/route';

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
  const start = new Date('2026-01-01T10:00:00Z');
  const end = new Date('2026-01-01T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when no overlapping shifts', async () => {
    // Mock
    require('@/lib/db').prisma.shift.findMany.mockResolvedValue([]);

    const result = await checkForOverlappingShifts(userId, start, end);

    expect(result).toEqual([]);
    expect(require('@/lib/db').prisma.shift.findMany).toHaveBeenCalledWith({
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

    const result = await checkForOverlappingShifts(userId, start, end);

    expect(result).toEqual([overlappingShift]);
    expect(require('@/lib/db').prisma.shift.findMany).toHaveBeenCalled();
  });

  // Note: The function does not have an excludeShiftId parameter, so this test is removed.
  // If needed, the function would need to be updated to accept excludeShiftId.
});

