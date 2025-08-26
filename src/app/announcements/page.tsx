// src/app/announcements/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserLayout } from "@/components/layouts/UserLayout";
import { AnnouncementsList } from "@/components/announcements/AnnouncementsList";
import connectToDatabase from "@/lib/database";
import { AnnouncementPost } from "@/models/AnnouncementPost";

async function getPublishedAnnouncements() {
  try {
    await connectToDatabase();
    
    const announcements = await AnnouncementPost.find({ 
      status: 'published' 
    })
    .sort({ createdAt: -1 })
    .populate('authorId', 'name email')
    .lean();

    return announcements.map((announcement: any) => ({
      _id: announcement._id.toString(),
      title: announcement.title,
      content: announcement.content,
      coverImage: announcement.coverImage,
      status: announcement.status,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt,
      author: {
        _id: announcement.authorId._id.toString(),
        name: announcement.authorId.name,
        email: announcement.authorId.email
      },
      formattedDate: new Date(announcement.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }));
  } catch (error) {
    console.error('Error fetching announcements:', error);
    return [];
  }
}

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  const announcements = await getPublishedAnnouncements();

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Latest Announcements
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Stay updated with the latest news, updates, and important information from our platform.
            </p>
          </div>

          {/* Announcements List */}
          <AnnouncementsList 
            announcements={announcements} 
            isAuthenticated={!!session?.user}
          />
      </div>
    </UserLayout>
  );
}
