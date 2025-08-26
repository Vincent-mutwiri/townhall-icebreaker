// src/app/api/updates/[id]/react/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { UpdatePost } from '@/models/UpdatePost';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const userId = (session.user as any).id;

    // Find the post
    const post = await UpdatePost.findById(id);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // Check if user has already upvoted
    const hasUpvoted = post.upvotes.includes(userId);
    
    let updatedPost;
    if (hasUpvoted) {
      // Remove upvote
      updatedPost = await UpdatePost.findByIdAndUpdate(
        id,
        { 
          $pull: { upvotes: userId },
          $inc: { upvoteCount: -1 }
        },
        { new: true }
      );
    } else {
      // Add upvote
      updatedPost = await UpdatePost.findByIdAndUpdate(
        id,
        { 
          $addToSet: { upvotes: userId },
          $inc: { upvoteCount: 1 }
        },
        { new: true }
      );
    }

    return NextResponse.json({
      message: hasUpvoted ? 'Upvote removed' : 'Post upvoted',
      isLiked: !hasUpvoted,
      upvoteCount: updatedPost.upvoteCount
    });

  } catch (error) {
    console.error('Error handling upvote:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
