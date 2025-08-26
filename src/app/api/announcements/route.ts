// src/app/api/announcements/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { AnnouncementPost } from '@/models/AnnouncementPost';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch the 3 most recent PUBLISHED posts, populating the author's name
    const announcements = await AnnouncementPost.find({ status: 'published' })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('authorId', 'name email') // Fetch author's name and email
      .lean(); // Use lean() for better performance since we're not modifying

    // Transform the data for better frontend consumption
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
      },
      formattedDate: new Date(announcement.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }));

    return NextResponse.json(transformedAnnouncements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return NextResponse.json({ 
      message: 'An unexpected error occurred while fetching announcements.',
      announcements: [] // Return empty array as fallback
    }, { status: 500 });
  }
}

// Add cache headers for better performance
export const revalidate = 60; // Revalidate every 60 seconds
