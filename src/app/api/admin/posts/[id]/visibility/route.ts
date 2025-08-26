// src/app/api/admin/posts/[id]/visibility/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { UpdatePost } from '@/models/UpdatePost';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const { isPublic } = await request.json();

    // Find and update the post
    const updatedPost = await UpdatePost.findByIdAndUpdate(
      id,
      { isPublic },
      { new: true }
    );

    if (!updatedPost) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Post visibility updated successfully',
      post: updatedPost
    });

  } catch (error) {
    console.error('Error updating post visibility:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
