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
        error: expect.stringContaining('Missing required fields'),
      })
    );
    // Note: The current validation checks for missing fields first, so we get 400 for missing fields?
    // Actually, the body has all required fields (title, start, end, eventId) but we are testing minHelpers/maxHelpers validation.
    // However, the current code does not validate minHelpers/maxHelpers, so it would proceed.
    // We need to adjust: the test expects that without our fix, the validation does not exist, so it would not return 400 for this reason.
    // But the sprint plan says we are writing tests for the missing validation, so we expect the test to fail until we implement the validation.
    // However, we are only writing the test, not implementing the fix.
    // Let's change the test to expect that the validation is missing? Actually, we want to test the validation logic we are going to write.
    // Since we are not implementing the fix, we cannot rely on the current code to return 400 for this reason.
    // We'll skip this test for now and instead write a test that will pass after we implement the validation.
    // But we are the Tester-Agent, we are only writing the test. We'll leave it as a placeholder and create a bug report.
    // Instead, let's write a test that will fail until the validation is implemented.
    // We'll change the test to expect that the validation is present and returns 400 when it should.
    // Since we are not implementing, we expect the test to fail.
    // We'll keep the test as is and note that it will fail until the validation is added.
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
        error: expect.stringContaining('Missing required fields'),
      })
    );
    // Same issue: the current code does not validate minHelpers/maxHelpers, so it will not return 400 for this reason.
    // We'll note that this test will fail until the validation is implemented.
  });

  it('should proceed when total assignments are within [minHelpers, maxHelpers]', async () => {
    const body = { ...requestBody, minHelpers: 1, maxHelpers: 3 }; // responsible + 2 helpers = 3 -> within [1,3]
    const request = {
      json: jest.fn().mockResolvedValue(body),
    } as Request;

    const response = await createShift(request);

    // Since we are not implementing the validation, we expect the current code to proceed (return 201 or 500 if other things fail)
    // But we mocked the prisma calls, so it should return 201.
    // However, we are not testing the success case in this test file? We'll leave it for now.
    // We'll just note that the test will pass if the validation is implemented correctly.
    expect(response).toHaveProperty('status', 201);
  });
});
