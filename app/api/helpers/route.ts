import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const helpers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'CREW', 'VOLUNTEER'],
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        availability: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ helpers });
  } catch (error) {
    console.error('Error fetching helpers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch helpers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, password, role, availability } = body;

    if (!email || !name || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const helper = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        availability: availability || [],
      },
    });

    return NextResponse.json(
      {
        helper: {
          id: helper.id,
          email: helper.email,
          name: helper.name,
          role: helper.role,
          availability: helper.availability,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating helper:', error);
    return NextResponse.json(
      { error: 'Failed to create helper' },
      { status: 500 }
    );
  }
}
