// Mock prisma
const prismaMock = {
  user: {
    findMany: jest.fn(),
  },
  shift: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  shiftAssignment: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callbacks) => {
    // Simulate transaction by executing each callback and collecting results
    const results = [];
    for (const callback of callbacks) {
      results.push(callback(prismaMock));
    }
    return results;
  }),
};

// Mock dependencies
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => {
      return {
        json: async () => body,
        status: init?.status ?? 200,
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
jest.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));

// Now import the module under test
import { PATCH } from '../app/api/shifts/route';

describe('Auto-Assign Validation (respects maxHelpers)', () => {
  const session = {
    user: {
      role: 'ADMIN',
      id: 'admin-1',
    },
  };
  const eventId = 'event-1';
  const start = new Date('2026-04-25T10:00:00Z');
  const end = new Date('2026-04-25T12:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock session
    (require('next-auth').getServerSession as jest.Mock).mockResolvedValue(session);
  });

  it('should assign up to maxHelpers when shift has zero assignments', async () => {
    // Setup: one shift with minHelpers=1, maxHelpers=2, currently 0 assignments
    prismaMock.shift.findMany.mockResolvedValue([
      {
        id: 'shift-1',
        eventId,
        minHelpers: 1,
        maxHelpers: 2,
        assignments: [], // 0 assignments
        start: start,
        end: end,
      },
    ]);

    // Mock volunteers: 3 available volunteers for this shift
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'vol-1',
        role: 'VOLUNTEER',
        availabilitySlots: [
          {
            start: new Date('2026-04-25T09:00:00Z'),
            end: new Date('2026-04-25T13:00:00Z'),
          },
        ],
      },
      {
        id: 'vol-2',
        role: 'VOLUNTEER',
        availabilitySlots: [
          {
            start: new Date('2026-04-25T09:00:00Z'),
            end: new Date('2026-04-25T13:00:00Z'),
          },
        ],
      },
      {
        id: 'vol-3',
        role: 'VOLUNTEER',
        availabilitySlots: [
          {
            start: new Date('2026-04-25T09:00:00Z'),
            end: new Date('2026-04-25T13:00:00Z'),
          },
        ],
      },
    ]);

    const request = new Request('http://localhost/api/shifts', {
      method: 'PATCH',
      body: JSON.stringify({ eventId }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.message).toMatch(/Created \d+ assignments/);

    // Check that shiftAssignment.create was called exactly 2 times
    expect(prismaMock.shiftAssignment.create).toHaveBeenCalledTimes(2);
  });

  it('should not exceed maxHelpers when shift already has some assignments', async () => {
    // Setup: one shift with minHelpers=1, maxHelpers=2, currently 1 assignment
    prismaMock.shift.findMany.mockResolvedValue([
      {
        id: 'shift-1',
        eventId,
        minHelpers: 1,
        maxHelpers: 2,
        assignments: [{ id: 'assign-1', userId: 'existing-user' }], // 1 assignment
        start: start,
        end: end,
      },
    ]);

    // Mock volunteers: 3 available volunteers for this shift
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'vol-1',
        role: 'VOLUNTEER',
        availabilitySlots: [
          {
            start: new Date('2026-04-25T09:00:00Z'),
            end: new Date('2026-04-25T13:00:00Z'),
          },
        ],
      },
      {
        id: 'vol-2',
        role: 'VOLUNTEER',
        availabilitySlots: [
          {
            start: new Date('2026-04-25T09:00:00Z'),
            end: new Date('2026-04-25T13:00:00Z'),
          },
        ],
      },
      {
        id: 'vol-3',
        role: 'VOLUNTEER',
        availabilitySlots: [
          {
            start: new Date('2026-04-25T09:00:00Z'),
            end: new Date('2026-04-25T13:00:00Z'),
          },
        ],
      },
    ]);

    const request = new Request('http://localhost/api/shifts', {
      method: 'PATCH',
      body: JSON.stringify({ eventId }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.message).toMatch(/Created \d+ assignments/);

    // Should have created exactly 1 assignment (because maxHelpers=2 and we already have 1)
    expect(prismaMock.shiftAssignment.create).toHaveBeenCalledTimes(1);
  });

  it('should assign zero when shift already at maxHelpers', async () => {
    // Setup: one shift with minHelpers=1, maxHelpers=2, currently 2 assignments
    prismaMock.shift.findMany.mockResolvedValue([
      {
        id: 'shift-1',
        eventId,
        minHelpers: 1,
        maxHelpers: 2,
        assignments: [
          { id: 'assign-1', userId: 'user-1' },
          { id: 'assign-2', userId: 'user-2' },
        ], // 2 assignments
        start: start,
        end: end,
      },
    ]);

    // Mock volunteers: 3 available volunteers for this shift
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'vol-1',
        role: 'VOLUNTEER',
        availabilitySlots: [
          {
            start: new Date('2026-04-25T09:00:00Z'),
            end: new Date('2026-04-25T13:00:00Z'),
          },
        ],
      },
      {
        id: 'vol-2',
        role: 'VOLUNTEER',
        availabilitySlots: [
          {
            start: new Date('2026-04-25T09:00:00Z'),
            end: new Date('2026-04-25T13:00:00Z'),
          },
        ],
      },
      {
        id: 'vol-3',
        role: 'VOLUNTEER',
        availabilitySlots: [
          {
            start: new Date('2026-04-25T09:00:00Z'),
            end: new Date('2026-04-25T13:00:00Z'),
          },
        ],
      },
    ]);

    const request = new Request('http://localhost/api/shifts', {
      method: 'PATCH',
      body: JSON.stringify({ eventId }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.message).toMatch(/Created \d+ assignments/);

    // Should have created 0 assignments (because already at maxHelpers)
    expect(prismaMock.shiftAssignment.create).toHaveBeenCalledTimes(0);
  });
});