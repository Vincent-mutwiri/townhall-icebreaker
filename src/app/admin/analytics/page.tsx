// src/app/admin/analytics/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { User } from "@/models/User";
import { Result } from "@/models/Result";
import { UpdatePost } from "@/models/UpdatePost";
import { HostedGame } from "@/models/HostedGame";
import { Course } from "@/models/Course";
import { PlatformAnalytics } from "@/components/admin/PlatformAnalytics";

async function getAnalyticsData() {
  await connectToDatabase();
  
  // Get date ranges
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // User analytics
  const totalUsers = await User.countDocuments();
  const newUsersThisMonth = await User.countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo } 
  });
  const activeUsersThisWeek = await User.countDocuments({ 
    updatedAt: { $gte: sevenDaysAgo } 
  });
  
  // Content analytics
  const totalCourses = await Course.countDocuments();
  const totalGames = await HostedGame.countDocuments();
  const totalPosts = await UpdatePost.countDocuments();
  
  // Activity analytics
  const totalResults = await Result.countDocuments();
  const resultsThisMonth = await Result.countDocuments({ 
    createdAt: { $gte: thirtyDaysAgo } 
  });
  
  // Top performers
  const topUsers = await User.find({})
    .select('name email points level stats')
    .sort({ points: -1 })
    .limit(10);
  
  // Recent activity
  const recentActivity = await Result.aggregate([
    {
      $match: {
        createdAt: { $gte: sevenDaysAgo }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        source: 1,
        score: 1,
        pointsAwarded: 1,
        createdAt: 1,
        'user.name': 1,
        'user.email': 1
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $limit: 20
    }
  ]);
  
  // Daily activity for the last 30 days
  const dailyActivity = await Result.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 },
        totalPoints: { $sum: "$pointsAwarded" }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
  
  return {
    userStats: {
      total: totalUsers,
      newThisMonth: newUsersThisMonth,
      activeThisWeek: activeUsersThisWeek
    },
    contentStats: {
      courses: totalCourses,
      games: totalGames,
      posts: totalPosts
    },
    activityStats: {
      totalResults,
      resultsThisMonth
    },
    topUsers: JSON.parse(JSON.stringify(topUsers)),
    recentActivity: JSON.parse(JSON.stringify(recentActivity)),
    dailyActivity: JSON.parse(JSON.stringify(dailyActivity))
  };
}

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'admin') {
    redirect('/dashboard');
  }

  const analyticsData = await getAnalyticsData();

  return <PlatformAnalytics data={analyticsData} />;
}
