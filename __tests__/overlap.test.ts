import { checkForOverlappingShifts } from '@/app/api/shifts/route';

// Mock prisma
const mockPrisma = {
  shift: {
    findMany: jest.fn(),
  },
};

// Mock the prisma module
jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('checkForOverlappingShifts', () => {
  const userId = 'user1';
  const eventId = 'event1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when no overlapping shifts', async () => {
    mockPrisma.shift.findMany.mockResolvedValue([]);

    const result = await checkForOverlappingShifts(
      userId,
      eventId,
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-01T12:00:00Z')
    );

    expect(result).toEqual([]);
    expect(mockPrisma.shift.findMany).toHaveBeenCalledWith({
      where: {
        eventId: 'event1',
        assignments: {
          some: {
            userId: 'user1',
          },
        },
        OR: [
          {
            // New shift starts during existing shift
            AND: [
              { start: { lte: new Date('2026-01-01T10:00:00Z') } },
              { end: { gt: new Date('2026-01-01T10:00:00Z') } },
            ],
          },
          {
            // New shift ends during existing shift
            AND: [
              { start: { lt: new Date('2026-01-01T12:00:00Z') } },
              { end: { gte: new Date('2026-01-01T12:00:00Z') } },
            ],
          },
          {
            // New shift completely contains existing shift
            AND: [
              { start: { gte: new Date('2026-01-01T10:00:00Z') } },
              { end: { lte: new Date('2026-01-01T12:00:00Z') } },
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
    mockPrisma.shift.findMany.mockResolvedValue([overlappingShift]);

    const result = await checkForOverlappingShifts(
      userId,
      eventId,
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-01T12:00:00Z')
    );

    expect(result).toEqual([overlappingShift]);
  });

  it('should exclude the shift itself when excludeShiftId is provided', async () => {
    mockPrisma.shift.findMany.mockResolvedValue([]);

    await checkForOverlappingShifts(
      userId,
      eventId,
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-01T12:00:00Z'),
      'shift123'
    );

    expect(mockPrisma.shift.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: 'shift123' },
        }),
      })
    );
  });
});
