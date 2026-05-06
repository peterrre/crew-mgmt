// ChatMessage API route tests
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status ?? 200,
      headers: new Map(),
    }),
  },
  NextRequest: jest.fn().mockImplementation((url: string, options: { method: string; body?: any }) => ({
    url,
    method: options.method,
    json: async () => (typeof options.body === 'string' ? JSON.parse(options.body) : options.body),
  })),
}));

jest.mock('../lib/db', () => ({
  prisma: {
    chatMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { POST, GET } from '../app/api/chatmessages/route';
import { prisma } from '../lib/db';
import { getServerSession } from 'next-auth';

const mockPrisma = prisma as unknown as {
  chatMessage: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
};

const mockGetServerSession = getServerSession as jest.Mock;

describe('POST /api/chatmessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);
    const req = new Request('http://localhost/api/chatmessages?shiftId=shift1', {
      method: 'POST',
      body: JSON.stringify({ content: 'Test message' }),
    });
    // @ts-expect-error - NextRequest mock
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if shiftId is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user1' } });
    const req = new Request('http://localhost/api/chatmessages', {
      method: 'POST',
      body: JSON.stringify({ content: 'Test message' }),
    });
    // @ts-expect-error
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 if content is empty', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user1' } });
    const req = new Request('http://localhost/api/chatmessages?shiftId=shift1', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    });
    // @ts-expect-error
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('creates a chat message and returns 201', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user1' } });
    const created = {
      id: 'msg1',
      userId: 'user1',
      shiftId: 'shift1',
      message: 'Hello!',
      read: false,
      createdAt: new Date(),
    };
    mockPrisma.chatMessage.create.mockResolvedValue(created);

    const req = new Request('http://localhost/api/chatmessages?shiftId=shift1', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello!' }),
    });
    // @ts-expect-error
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.message).toBe('Hello!');
    expect(mockPrisma.chatMessage.create).toHaveBeenCalledWith({
      data: { userId: 'user1', shiftId: 'shift1', message: 'Hello!' },
    });
  });
});

describe('GET /api/chatmessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 if shiftId is missing', async () => {
    const req = new Request('http://localhost/api/chatmessages', { method: 'GET' });
    // @ts-expect-error
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns chat messages for a shift', async () => {
    const messages = [
      { id: 'msg1', userId: 'user1', shiftId: 'shift1', message: 'Hi', read: false, createdAt: new Date(), user: { id: 'user1', name: 'Alice', image: null } },
      { id: 'msg2', userId: 'user2', shiftId: 'shift1', message: 'Hey', read: false, createdAt: new Date(), user: { id: 'user2', name: 'Bob', image: null } },
    ];
    mockPrisma.chatMessage.findMany.mockResolvedValue(messages);

    const req = new Request('http://localhost/api/chatmessages?shiftId=shift1', { method: 'GET' });
    // @ts-expect-error
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(mockPrisma.chatMessage.findMany).toHaveBeenCalledWith({
      where: { shiftId: 'shift1' },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'asc' },
    });
  });
});
