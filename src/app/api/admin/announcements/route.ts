// src/app/api/admin/announcements/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { AnnouncementPost } from '@/models/AnnouncementPost';

// GET handler to fetch all announcements for admin
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  if (user?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    
    const announcements = await AnnouncementPost.find()
      .sort({ createdAt: -1 })
      .populate('authorId', 'name email')
      .lean();

    const transformedAnnouncements = announcements.map(announcement => ({
      _id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      coverImage: announcement.coverImage,
      status: announcement.status,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      author: {
        _id: announcement.authorId._id,
        name: announcement.authorId.name,
        email: announcement.authorId.email
      }
    }));

    return NextResponse.json(transformedAnnouncements);
  } catch (error) {
    console.error('Error fetching admin announcements:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// POST handler to create a new announcement
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  if (user?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { title, content, coverImage, status } = await request.json();

    // Validation
    if (!title || !content) {
      return NextResponse.json({ 
        message: 'Title and content are required.' 
      }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json({ 
        message: 'Title must be 200 characters or less.' 
      }, { status: 400 });
    }

    if (content.length > 2000) {
      return NextResponse.json({ 
        message: 'Content must be 2000 characters or less.' 
      }, { status: 400 });
    }

    if (coverImage && !/^https?:\/\/.+/.test(coverImage)) {
      return NextResponse.json({ 
        message: 'Cover image must be a valid URL.' 
      }, { status: 400 });
    }

    const validStatuses = ['draft', 'published'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ 
        message: 'Status must be either "draft" or "published".' 
      }, { status: 400 });
    }

    const newPost = new AnnouncementPost({
      title: title.trim(),
      content: content.trim(),
      coverImage: coverImage?.trim() || undefined,
      status: status || 'draft',
      authorId: user.id,
    });

    await newPost.save();
    
    // Populate author info for response
    await newPost.populate('authorId', 'name email');

    const responsePost = {
      _id: newPost._id,
      title: newPost.title,
      content: newPost.content,
      coverImage: newPost.coverImage,
      status: newPost.status,
      createdAt: newPost.createdAt,
      updatedAt: newPost.updatedAt,
      author: {
        _id: newPost.authorId._id,
        name: newPost.authorId.name,
        email: newPost.authorId.email
      }
    };

    return NextResponse.json(responsePost, { status: 201 });
  } catch (error) {
    console.error('Error creating announcement:', error);
    return NextResponse.json({ 
      message: 'An unexpected error occurred while creating the announcement.' 
    }, { status: 500 });
  }
}
