// src/app/api/admin/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/database';
import { UpdatePost } from '@/models/UpdatePost';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;

    // Find and delete the post
    const deletedPost = await UpdatePost.findByIdAndDelete(id);

    if (!deletedPost) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
