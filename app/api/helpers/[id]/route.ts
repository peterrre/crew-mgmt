import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role, password, availability } = body;
    const { id } = params;

    const updateData: any = {};

    if (role) {
      updateData.role = role;
    }

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    if (availability !== undefined) {
      updateData.availability = availability;
    }

    const helper = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        availability: true,
      },
    });

    return NextResponse.json({ helper });
  } catch (error) {
    console.error('Error updating helper:', error);
    return NextResponse.json(
      { error: 'Failed to update helper' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting helper:', error);
    return NextResponse.json(
      { error: 'Failed to delete helper' },
      { status: 500 }
    );
  }
}
