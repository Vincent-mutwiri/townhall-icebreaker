// src/app/api/admin/users/[id]/role/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/database';
import { User } from '@/models/User';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const { role } = await request.json();

    // Validate role
    if (!['user', 'teacher', 'admin'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // Prevent admin from changing their own role
    if (id === (session.user as any).id) {
      return NextResponse.json({ message: 'Cannot change your own role' }, { status: 400 });
    }

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'User role updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
