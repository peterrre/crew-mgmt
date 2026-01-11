import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: {
        availabilitySlots: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { availability } = body; // Array of { start, end, isRecurring, recurrencePattern, recurrenceEnd }

    const userId = (session.user as any).id;

    // Delete existing availability slots
    await prisma.availabilitySlot.deleteMany({
      where: { userId },
    });

    // Create new availability slots
    if (availability && availability.length > 0) {
      await prisma.availabilitySlot.createMany({
        data: availability.map((slot: any) => ({
          userId,
          start: new Date(slot.start),
          end: new Date(slot.end),
          isRecurring: slot.isRecurring || false,
          recurrencePattern: slot.recurrencePattern || null,
          recurrenceEnd: slot.recurrenceEnd ? new Date(slot.recurrenceEnd) : null,
        })),
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        availabilitySlots: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
