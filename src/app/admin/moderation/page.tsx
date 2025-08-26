// src/app/admin/moderation/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { UpdatePost } from "@/models/UpdatePost";
import { ContentModeration } from "@/components/admin/ContentModeration";
import { AdminLayout } from "@/components/layouts/AdminLayout";

async function getPostsForModeration() {
  await connectToDatabase();
  
  const posts = await UpdatePost.aggregate([
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
        isPublic: 1,
        createdAt: 1,
        updatedAt: 1,
        'author._id': 1,
        'author.name': 1,
        'author.email': 1,
        'author.avatar': 1
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $limit: 100
    }
  ]);

  return JSON.parse(JSON.stringify(posts));
}

async function getModerationStats() {
  await connectToDatabase();
  
  const totalPosts = await UpdatePost.countDocuments();
  const publicPosts = await UpdatePost.countDocuments({ isPublic: true });
  const pinnedPosts = await UpdatePost.countDocuments({ isPinned: true });
  const recentPosts = await UpdatePost.countDocuments({ 
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
  });
  
  return {
    total: totalPosts,
    public: publicPosts,
    hidden: totalPosts - publicPosts,
    pinned: pinnedPosts,
    recentWeek: recentPosts
  };
}

export default async function AdminModerationPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/dashboard');
  }

  const posts = await getPostsForModeration();
  const stats = await getModerationStats();

  return (
    <AdminLayout>
      <ContentModeration posts={posts} stats={stats} />
    </AdminLayout>
  );
}
