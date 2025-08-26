// src/app/api/admin/announcements/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/database';
import { AnnouncementPost } from '@/models/AnnouncementPost';

// PATCH handler to update an announcement
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  if (user?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const { title, content, coverImage, status } = await request.json();

    // Find the announcement
    const announcement = await AnnouncementPost.findById(id);
    if (!announcement) {
      return NextResponse.json({ message: 'Announcement not found' }, { status: 404 });
    }

    // Validation
    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json({ 
          message: 'Title cannot be empty.' 
        }, { status: 400 });
      }
      if (title.length > 200) {
        return NextResponse.json({ 
          message: 'Title must be 200 characters or less.' 
        }, { status: 400 });
      }
      announcement.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return NextResponse.json({ 
          message: 'Content cannot be empty.' 
        }, { status: 400 });
      }
      if (content.length > 2000) {
        return NextResponse.json({ 
          message: 'Content must be 2000 characters or less.' 
        }, { status: 400 });
      }
      announcement.content = content.trim();
    }

    if (coverImage !== undefined) {
      if (coverImage && !/^https?:\/\/.+/.test(coverImage)) {
        return NextResponse.json({ 
          message: 'Cover image must be a valid URL.' 
        }, { status: 400 });
      }
      announcement.coverImage = coverImage?.trim() || undefined;
    }

    if (status !== undefined) {
      const validStatuses = ['draft', 'published'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ 
          message: 'Status must be either "draft" or "published".' 
        }, { status: 400 });
      }
      announcement.status = status;
    }

    await announcement.save();
    
    // Populate author info for response
    await announcement.populate('authorId', 'name email');

    const responsePost = {
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
    };

    return NextResponse.json(responsePost);
  } catch (error) {
    console.error('Error updating announcement:', error);
    return NextResponse.json({ 
      message: 'An unexpected error occurred while updating the announcement.' 
    }, { status: 500 });
  }
}

// DELETE handler to delete an announcement
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  
  if (user?.role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;

    const announcement = await AnnouncementPost.findById(id);
    if (!announcement) {
      return NextResponse.json({ message: 'Announcement not found' }, { status: 404 });
    }

    await AnnouncementPost.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: 'Announcement deleted successfully',
      deletedId: id
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return NextResponse.json({ 
      message: 'An unexpected error occurred while deleting the announcement.' 
    }, { status: 500 });
  }
}
