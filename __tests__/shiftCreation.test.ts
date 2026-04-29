// Mock prisma
const prismaMock: any = {
  event: {
    findUnique: jest.fn(),
  },
  eventCrew: {
    findMany: jest.fn(),
  },
  shift: {
    findMany: jest.fn(),
    create: jest.fn().mockResolvedValue({ id: 'new-shift-id' }),
    findUnique: jest.fn().mockResolvedValue({
      id: 'new-shift-id',
      title: 'Test Shift',
      start: new Date('2026-04-25T10:00:00Z'),
      end: new Date('2026-04-25T12:00:00Z'),
      eventId: 'event-1',
      helperId: 'user-1',
      minHelpers: 1,
      maxHelpers: 3,
      assignments: [],
    }),
  },
  shiftAssignment: {
    create: jest.fn().mockResolvedValue({}),
  },
  $transaction: jest.fn((callback) => callback(prismaMock)),
};

// Mock dependencies
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => {
      return {
        json: async () => body,
        status: init?.status ?? 200,
      };
    },
  },
}));
jest.mock('next-auth');
jest.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));
jest.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

// Now import the module under test
import { POST } from '../app/api/shifts/route';

describe('Shift Creation Validation', () => {
  const session = {
    user: {
      role: 'ADMIN',
      id: 'admin-1',
    },
  };
  const eventId = 'event-1';
  const userId = 'user-1';
  const start = new Date('2026-04-25T10:00:00Z');
  const end = new Date('2026-04-25T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock session
    (jest.requireMock('next-auth').getServerSession as jest.Mock).mockResolvedValue(session);
    // Mock event exists
    prismaMock.event.findUnique.mockResolvedValue({ id: eventId });
    // Mock no overlapping shifts
    prismaMock.shift.findMany.mockResolvedValue([]);
  });

  it('should create shift with valid assignments count', async () => {
    // For this test, we have 1 assignment (responsible only)
    prismaMock.eventCrew.findMany.mockResolvedValue([
      { id: 'ec-1', eventId, userId: userId },
    ]);

    const request = new Request('http://localhost/api/shifts', {
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

    const request = new Request('http://localhost/api/shifts', {
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

    const request = new Request('http://localhost/api/shifts', {
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

    const request = new Request('http://localhost/api/shifts', {
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

    const request = new Request('http://localhost/api/shifts', {
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