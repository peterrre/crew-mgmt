// Mock dependencies first
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => {
      return {
        json: async () => body,
        status: init?.status ?? 200,
        headers: new Map(),
      };
    },
  },
}));
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));

let prismaMock = {} as any;

jest.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

let POST: any;

// We will import the module under test in a beforeAll
beforeAll(() => {
  // Set up the mock object
  prismaMock.event = { findUnique: jest.fn() };
  prismaMock.eventCrew = { findMany: jest.fn() };
  prismaMock.shift = {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  };
  prismaMock.shiftAssignment = { create: jest.fn() };
  prismaMock.$transaction = jest.fn((callback) => callback(prismaMock));
  
  // Import after mocks are set up
  const { POST: importedPost } = require('../app/api/shifts/route');
  POST = importedPost;
});

beforeEach(() => {
  jest.clearAllMocks();
  // Set up prismaMock return values
  const eventId = 'event-1';
  const userId = 'user-1';
  prismaMock.event.findUnique.mockResolvedValue({ id: eventId });
  prismaMock.eventCrew.findMany.mockResolvedValue([]);
  prismaMock.shift.findMany.mockResolvedValue([]);
  prismaMock.shift.create.mockResolvedValue({ id: 'new-shift-id' });
  prismaMock.shift.findUnique.mockResolvedValue({
    id: 'new-shift-id',
    title: 'Test Shift',
    start: new Date('2026-04-25T10:00:00Z'),
    end: new Date('2026-04-25T12:00:00Z'),
    eventId: 'event-1',
    helperId: 'user-1',
    minHelpers: 1,
    maxHelpers: 3,
    assignments: [],
  });
  prismaMock.shiftAssignment.create.mockResolvedValue({});
  prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));
  // Mock session: getServerSession should return our session when called with authOptions
  const session = {
    user: {
      role: 'ADMIN',
      id: 'admin-1',
    },
  };
  const { getServerSession } = require('next-auth');
  (getServerSession as jest.Mock).mockResolvedValue(session);
});

describe('Shift Creation Validation', () => {
  const eventId = 'event-1';
  const userId = 'user-1';
  const start = new Date('2026-04-25T10:00:00Z');
  const end = new Date('2026-04-25T12:00:00Z');

  it('should create shift with valid assignments count', async () => {
    // For this test, we have 1 assignment (responsible only)
    prismaMock.eventCrew.findMany.mockResolvedValue([
      { id: 'ec-1', eventId, userId: userId },
    ]);

    const request = new Request(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shifts`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Shift',
        start: start.toISOString(),
        end: end.toISOString(),
        eventId,
        responsibleUserId: userId,
        helperIds: [], // total assignments = 1
        minHelpers: 1,
        maxHelpers: 3,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('shift');
  });

  it('should reject shift with too few assignments (below minHelpers)', async () => {
    // For this test, we have 1 assignment (responsible only)
    prismaMock.eventCrew.findMany.mockResolvedValue([
      { id: 'ec-1', eventId, userId: userId },
    ]);

    const request = new Request(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shifts`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Shift',
        start: start.toISOString(),
        end: end.toISOString(),
        eventId,
        responsibleUserId: userId,
        helperIds: [], // total assignments = 1
        minHelpers: 2, // need at least 2
        maxHelpers: 3,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
  });

  it('should reject shift with too many assignments (above maxHelpers)', async () => {
    // For this test, we have 4 assignments (responsible + 3 helpers)
    prismaMock.eventCrew.findMany.mockResolvedValue([
      { id: 'ec-1', eventId, userId: userId },
      { id: 'ec-2', eventId, userId: 'user-2' },
      { id: 'ec-3', eventId, userId: 'user-3' },
      { id: 'ec-4', eventId, userId: 'user-4' },
    ]);

    const request = new Request(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shifts`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Shift',
        start: start.toISOString(),
        end: end.toISOString(),
        eventId,
        responsibleUserId: userId,
        helperIds: ['user-2', 'user-3', 'user-4'], // total assignments = 4 (responsible + 3 helpers)
        minHelpers: 1,
        maxHelpers: 3, // max allowed is 3
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('error');
  });

  it('should accept shift when assignments equal maxHelpers', async () => {
    // For this test, we have 3 assignments (responsible + 2 helpers)
    prismaMock.eventCrew.findMany.mockResolvedValue([
      { id: 'ec-1', eventId, userId: userId },
      { id: 'ec-2', eventId, userId: 'user-2' },
      { id: 'ec-3', eventId, userId: 'user-3' },
    ]);

    const request = new Request(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shifts`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Shift',
        start: start.toISOString(),
        end: end.toISOString(),
        eventId,
        responsibleUserId: userId,
        helperIds: ['user-2', 'user-3'], // total assignments = 3
        minHelpers: 1,
        maxHelpers: 3,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('shift');
  });

  it('should accept shift when assignments equal minHelpers', async () => {
    // For this test, we have 1 assignment (responsible only)
    prismaMock.eventCrew.findMany.mockResolvedValue([
      { id: 'ec-1', eventId, userId: userId },
    ]);

    const request = new Request(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shifts`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Shift',
        start: start.toISOString(),
        end: end.toISOString(),
        eventId,
        responsibleUserId: userId,
        helperIds: [], // total assignments = 1
        minHelpers: 1,
        maxHelpers: 5,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty('shift');
  });
});