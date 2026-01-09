import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
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

    // Check if this is the first user
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    // Validate role - only allow valid enum values
    const validRoles = ['ADMIN', 'CREW', 'VOLUNTEER'];
    const userRole = validRoles.includes(role) ? role : 'VOLUNTEER';

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with appropriate role
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: isFirstUser ? 'ADMIN' : userRole,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
