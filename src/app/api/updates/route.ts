// src/app/api/updates/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/database';
import { UpdatePost } from '@/models/UpdatePost';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Fetch posts with author information using aggregation pipeline
    const posts = await UpdatePost.aggregate([
      {
        $match: {
          isPublic: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $project: {
          _id: 1,
          text: 1,
          media: 1,
          tags: 1,
          upvotes: 1,
          upvoteCount: 1,
          isPinned: 1,
          createdAt: 1,
          updatedAt: 1,
          'author._id': 1,
          'author.name': 1,
          'author.email': 1,
          'author.avatar': 1,
          'author.level': 1
        }
      },
      {
        $sort: {
          isPinned: -1, // Pinned posts first
          createdAt: -1 // Then by newest
        }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      }
    ]);

    // Add isLiked field for current user
    const currentUserId = (session.user as any).id;
    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: post.upvotes.some((upvoteId: any) => upvoteId.toString() === currentUserId)
    }));

    // Get total count for pagination
    const totalPosts = await UpdatePost.countDocuments({ isPublic: true });
    const totalPages = Math.ceil(totalPosts / limit);

    return NextResponse.json({
      posts: postsWithLikeStatus,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching updates:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const userId = (session.user as any).id;
    const { text, media, tags } = await request.json();

    // Validation
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ message: 'Post text is required' }, { status: 400 });
    }

    if (text.length > 1000) {
      return NextResponse.json({ message: 'Post text must be 1000 characters or less' }, { status: 400 });
    }

    // Create the post
    const newPost = await UpdatePost.create({
      authorId: userId,
      text: text.trim(),
      media: media || [],
      tags: tags || [],
      upvotes: [],
      upvoteCount: 0,
      isPublic: true,
      isPinned: false
    });

    // Fetch the created post with author information
    const postWithAuthor = await UpdatePost.aggregate([
      {
        $match: { _id: newPost._id }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author'
        }
      },
      {
        $unwind: '$author'
      },
      {
        $project: {
          _id: 1,
          text: 1,
          media: 1,
          tags: 1,
          upvotes: 1,
          upvoteCount: 1,
          isPinned: 1,
          createdAt: 1,
          updatedAt: 1,
          'author._id': 1,
          'author.name': 1,
          'author.email': 1,
          'author.avatar': 1,
          'author.level': 1
        }
      }
    ]);

    const post = postWithAuthor[0];
    post.isLiked = false; // New post, user hasn't liked it yet

    return NextResponse.json({
      message: 'Post created successfully',
      post
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating update post:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
