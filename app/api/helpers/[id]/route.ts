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
    const { id } = params;

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = (session.user as any).role === 'ADMIN';
    const isOwnProfile = (session.user as any).id === id;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, role, password } = body;

    const updateData: any = {};

    if (name !== undefined && (isAdmin || isOwnProfile)) {
      updateData.name = name;
    }

    if (role && isAdmin) {
      updateData.role = role;
    }

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const helper = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
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
