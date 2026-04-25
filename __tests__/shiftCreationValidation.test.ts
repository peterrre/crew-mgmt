import { NextResponse } from 'next/server';
import { POST as createShift } from '@/app/api/shifts/route';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => {
      return { json: () => Promise.resolve(body), ...init, status: init?.status };
    },
  },
}));

// Mock prisma
jest.mock('@/lib/db', () => ({
  prisma: {
    event: {
      findUnique: jest.fn(),
    },
    eventCrew: {
      findMany: jest.fn(),
    },
    shift: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn({
      shift: {
        create: jest.fn(),
      },
      shiftAssignment: {
        create: jest.fn(),
      },
      shift: {
        findUnique: jest.fn(),
      },
    })),
  },
}));

describe('POST /app/api/shifts (create shift)', () => {
  const session = { user: { id: 'admin1', role: 'ADMIN' } };
  const eventId = 'event1';
  const title = 'Test Shift';
  const start = '2026-01-01T10:00:00Z';
  const end = '2026-01-01T12:00:00Z';
  const minHelpers = 1;
  const maxHelpers = 2;

  const requestBody = {
    title,
    start,
    end,
    eventId,
    minHelpers,
    maxHelpers,
    responsibleUserId: 'user1',
    helperIds: ['user2', 'user3'], // total 3 assignments (1 responsible + 2 helpers)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock session to return admin user
    require('next-auth').getServerSession.mockResolvedValue(session);
    // Mock event exists
    require('@/lib/db').prisma.event.findUnique.mockResolvedValue({ id: eventId });
    // Mock event crew includes the users
    require('@/lib/db').prisma.eventCrew.findMany.mockResolvedValue([
      { eventId, userId: 'user1' },
      { eventId, userId: 'user2' },
      { eventId, userId: 'user3' },
    ]);
    // Mock no overlapping shifts (for the overlap check)
    require('@/lib/db').prisma.shift.findMany.mockResolvedValue([]);
  });

  it('should return 400 when total assignments < minHelpers', async () => {
    const body = { ...requestBody, minHelpers: 5, helperIds: [] }; // only responsible -> 1 < 5
    const request = {
      json: jest.fn().mockResolvedValue(body),
    } as Request;

    const response = await createShift(request);

    expect(response).toHaveProperty('status', 400);
    expect(response.json).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringContaining('Shift must have between 5 and 1 assignments'),
      })
    );
  });

  it('should return 400 when total assignments > maxHelpers', async () => {
    const body = { ...requestBody, maxHelpers: 1, helperIds: ['user2'] }; // responsible + 1 helper = 2 > 1
    const request = {
      json: jest.fn().mockResolvedValue(body),
    } as Request;

    const response = await createShift(request);

    expect(response).toHaveProperty('status', 400);
    expect(response.json).resolves.toEqual(
      expect.objectContaining({
        error: expect.stringContaining('Shift must have between 1 and 1 assignments'),
      })
    );
  });

  it('should proceed when total assignments are within [minHelpers, maxHelpers]', async () => {
    const body = { ...requestBody, minHelpers: 1, maxHelpers: 3 }; // responsible + 2 helpers = 3 -> within [1,3]
    const request = {
      json: jest.fn().mockResolvedValue(body),
    } as Request;

    const response = await createShift(request);

    // Since we mocked the prisma calls, we expect a 201 (created)
    expect(response).toHaveProperty('status', 201);
    expect(response.json).resolves.toEqual(
      expect.objectContaining({
        shift: expect.objectContaining({
          id: expect.any(String),
          title,
        }),
      })
    );
  });
});