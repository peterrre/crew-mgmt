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
      findUnique: jest.fn(),
    },
    shiftAssignment: {
      create: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn({
      shift: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      shiftAssignment: {
        create: jest.fn(),
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
    require('/home/hermes/crew-mgmt/lib/db').prisma.eventCrew.findMany.mockResolvedValue([
      { eventId, userId: 'user1' },
      { eventId, userId: 'user2' },
      { eventId, userId: 'user3' },
    ]);
    // Mock no overlapping shifts (for the overlap check)
    require('@/lib/db').prisma.shift.findMany.mockResolvedValue([]);
    // Mock shift creation to return a dummy shift
    require('@/lib/db').prisma.shift.create.mockResolvedValue({
      id: 'shift1',
      title,
      start: new Date(start),
      end: new Date(end),
      helperId: 'user1',
      eventId,
      minHelpers,
      maxHelpers,
    });
    // Mock shiftAssignment creation
    require('@/lib/db').prisma.shiftAssignment.create.mockResolvedValue({});
    // Mock finding the created shift
    require('@/lib/db').prisma.shift.findUnique.mockResolvedValue({
      id: 'shift1',
      title,
      start: new Date(start),
      end: new Date(end),
      helperId: { id: 'user1', name: 'Responsible', email: 'resp@test.com', role: 'RESPONSIBLE' },
      event: { id: eventId, name: 'Test Event', startDate: new Date(), endDate: new Date(), location: 'Test' },
      assignments: [
        { userId: 'user1', user: { id: 'user1', name: 'Responsible', email: 'resp@test.com', role: 'RESPONSIBLE' }, role: 'RESPONSIBLE' },
        { userId: 'user2', user: { id: 'user2', name: 'Helper1', email: 'help1@test.com', role: 'HELPER' }, role: 'HELPER' },
        { userId: 'user3', user: { id: 'user3', name: 'Helper2', email: 'help2@test.com', role: 'HELPER' }, role: 'HELPER' },
      ],
    });
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
        error: expect.stringContaining('Shift must have between 5 and 2 assignments (responsible + helpers). Provided: 1'),
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
        error: expect.stringContaining('Shift must have between 1 and 1 assignments (responsible + helpers). Provided: 2'),
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