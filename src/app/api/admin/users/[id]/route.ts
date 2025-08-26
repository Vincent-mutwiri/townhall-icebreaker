// src/app/api/admin/users/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/database';
import { User } from '@/models/User';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;

    // Prevent admin from deleting themselves
    if (id === (session.user as any).id) {
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 });
    }

    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // TODO: Clean up related data (results, posts, etc.)
    // This would require updating other collections to remove user references

    return NextResponse.json({ 
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
