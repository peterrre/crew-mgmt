import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const createChatMessageSchema = z.object({
  content: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get('shiftId');
    if (!shiftId) {
      return NextResponse.json({ error: 'shiftId is required' }, { status: 400 });
    }

    const body = await request.json();
    const result = createChatMessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 });
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        shiftId,
        message: result.data.content,
      },
    });

    return NextResponse.json(chatMessage, { status: 201 });
  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shiftId = searchParams.get('shiftId');
    if (!shiftId) {
      return NextResponse.json({ error: 'shiftId is required' }, { status: 400 });
    }

    // Optionally, we can also check for session to ensure the user is allowed to view comments for this shift.
    // For simplicity, we'll allow anyone to see comments (or we could check if the user is part of the shift/event).
    // We'll just fetch the messages.

    const chatMessages = await prisma.chatMessage.findMany({
      where: { shiftId },
      include: { user: { select: { id: true, name: true, image: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(chatMessages);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}