import { ROLES } from '@/constants/roles';
// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => {
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
      // Note: create and findUnique are mocked inside the transaction
    },
    shiftAssignment: {
      create: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => {
      // Create mock functions for the transaction
      const mockShiftCreate = jest.fn();
      const mockShiftFindUnique = jest.fn();
      const mockShiftAssignmentCreate = jest.fn();

      // Return an object that the transaction function will receive
      return fn({
        shift: {
          create: mockShiftCreate,
          findUnique: mockShiftFindUnique,
        },
        shiftAssignment: {
          create: mockShiftAssignmentCreate,
        }
      });
    }),
  },
}));

// Mock overlap utility
jest.mock('@/lib/utils/overlap', () => ({
  checkForOverlappingShifts: jest.fn(),
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
    (jest.requireMock('next-auth').getServerSession as jest.Mock).mockResolvedValue(session);
    // Mock event exists
    (jest.requireMock('@/lib/db').prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: eventId });
    // Mock event crew includes the users
    (jest.requireMock('@/lib/db').prisma.eventCrew.findMany as jest.Mock).mockResolvedValue([
      { eventId, userId: 'user1' },
      { eventId, userId: 'user2' },
      { eventId, userId: 'user3' },
    ]);
    // Mock no overlapping shifts (for the overlap check)
    (jest.requireMock('@/lib/db').prisma.shift.findMany as jest.Mock).mockResolvedValue([]);
    // Mock overlap utility to return no overlaps
    (jest.requireMock('@/lib/utils/overlap').checkForOverlappingShifts as jest.Mock).mockResolvedValue([]);

    // Get the mock functions from the $transaction call
    // We need to access the mock that was created in the $transaction mock implementation
    // Since we can't access it directly, we'll set up the mocks by replacing the implementation of $transaction
    // to capture the mock functions.

    // Create mock functions
    const mockShiftCreate = jest.fn();
    const mockShiftFindUnique = jest.fn();
    const mockShiftAssignmentCreate = jest.fn();

    // Override the $transaction mock to return our mock functions
    const prismaMock = jest.requireMock('@/lib/db').prisma;
    prismaMock.$transaction.mockImplementation((fn: any) => 
      fn({
        shift: {
          create: mockShiftCreate,
          findUnique: mockShiftFindUnique,
        },
        shiftAssignment: {
          create: mockShiftAssignmentCreate,
        }
      })
    );

    // Set up the mock implementations
    mockShiftCreate.mockResolvedValue({
      id: 'shift1',
      title,
      start: new Date(start),
      end: new Date(end),
      helperId: 'user1',
      eventId,
      minHelpers,
      maxHelpers,
    });
    mockShiftFindUnique.mockResolvedValue({
      id: 'shift1',
      title,
      start: new Date(start),
      end: new Date(end),
      helperId: { id: 'user1', name: 'Responsible', email: 'resp@test.com', role: ROLES.RESPONSIBLE },
      event: { id: eventId, name: 'Test Event', startDate: new Date(), endDate: new Date(), location: 'Test' },
      assignments: [
        { userId: 'user1', user: { id: 'user1', name: 'Responsible', email: 'resp@test.com', role: ROLES.RESPONSIBLE }, role: ROLES.RESPONSIBLE },
        { userId: 'user2', user: { id: 'user2', name: 'Helper1', email: 'help1@test.com', role: ROLES.HELPER }, role: ROLES.HELPER },
        { userId: 'user3', user: { id: 'user3', name: 'Helper2', email: 'help2@test.com', role: ROLES.HELPER }, role: ROLES.HELPER },
      ],
    });
    mockShiftAssignmentCreate.mockResolvedValue({});
  });

  // Import the route handler and get the POST function
  const route = require('../app/api/shifts/route');
  const createShift = route.POST;

  it('should return 400 when total assignments < minHelpers', async () => {
    const body = { ...requestBody, minHelpers: 5, helperIds: [] }; // only responsible -> 1 < 5
    const request = {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Request;

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
    } as unknown as Request;

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
    } as unknown as Request;

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