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
  $transaction: jest.fn(async (promises) => {
    // Wait for all promises to resolve
    return Promise.all(promises);
  }),
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
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));
jest.mock('@/lib/auth-options', () => ({
  authOptions: {},
}));
jest.mock('@/lib/db', () => ({
  prisma: prismaMock,
}));
jest.mock('@/lib/utils/overlap', () => ({
  checkForOverlappingShifts: jest.fn(),
}));

import type { PATCH as PatchType } from '@/app/api/shifts/route';
let PATCH: PatchType;

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
    jest.resetModules();
    // Mock session
    (jest.requireMock('next-auth').getServerSession as jest.Mock).mockResolvedValue(session);
    // Default mocks for prisma methods
    prismaMock.shiftAssignment.create.mockResolvedValue({});
    prismaMock.shift.update.mockResolvedValue({});
    // Import the route module (which will use the mocked dependencies)
    const route = require('../app/api/shifts/route');
    PATCH = route.PATCH;
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

     const request = new Request(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shifts`, {
      method: 'PATCH',
      body: JSON.stringify({ eventId }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.message).toMatch(/Created [0-9]+ assignments/);

    // Check that shiftAssignment.create was called exactly 2 times
    expect(prismaMock.shiftAssignment.create).toHaveBeenCalledTimes(2);
    // For the first assignment (responsible) we also expect a shift.update
    expect(prismaMock.shift.update).toHaveBeenCalledTimes(1);
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

     const request = new Request(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shifts`, {
      method: 'PATCH',
      body: JSON.stringify({ eventId }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.message).toMatch(/Created [0-9]+ assignments/);

    // Should have created exactly 1 assignment (because maxHelpers=2 and we already have 1)
    expect(prismaMock.shiftAssignment.create).toHaveBeenCalledTimes(1);
    // No shift.update because the assignment is not responsible (the existing assignment is responsible)
    expect(prismaMock.shift.update).toHaveBeenCalledTimes(0);
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

     const request = new Request(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/shifts`, {
      method: 'PATCH',
      body: JSON.stringify({ eventId }),
    });

    const response = await PATCH(request);
    expect(response.status).toBe(200);
    const responseBody = await response.json();
    expect(responseBody.message).toBe('No shifts need assignments');

    // Should have created 0 assignments (because already at maxHelpers)
    expect(prismaMock.shiftAssignment.create).toHaveBeenCalledTimes(0);
    expect(prismaMock.shift.update).toHaveBeenCalledTimes(0);
  });
});