// Mock dependencies
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

  it('should return empty array (mock implementation)', async () => {
    const result = await checkForOverlappingShifts(userId, eventId, start, end);

    // Mock implementation always returns empty array
    expect(result).toEqual([]);
    // Prisma should not be called in mock implementation
    expect(prisma.shift.findMany).not.toHaveBeenCalled();
  });

  it('should return empty array for any input (mock implementation)', async () => {
    const result = await checkForOverlappingShifts('any', 'any', start, end);

    // Mock implementation always returns empty array
    expect(result).toEqual([]);
  });
});