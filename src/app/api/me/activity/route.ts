// src/app/api/me/activity/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { Result } from '@/models/Result';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch user's recent activity with source details
    const activities = await Result.aggregate([
      {
        $match: {
          userId: userId,
          pointsAwarded: { $gt: 0 }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'sourceId',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      {
        $lookup: {
          from: 'hostedgames',
          localField: 'sourceId',
          foreignField: '_id',
          as: 'gameDetails'
        }
      },
      {
        $addFields: {
          sourceDetails: {
            $cond: {
              if: { $eq: ['$source', 'course'] },
              then: { $arrayElemAt: ['$courseDetails', 0] },
              else: { $arrayElemAt: ['$gameDetails', 0] }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          source: 1,
          score: 1,
          pointsAwarded: 1,
          createdAt: 1,
          details: 1,
          'sourceDetails.title': 1,
          'sourceDetails.description': 1
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Format activities for display
    const formattedActivities = activities.map(activity => {
      let activityType = '';
      let activityTitle = '';
      let activityDescription = '';
      let icon = '';
      let color = '';

      if (activity.source === 'course') {
        activityType = 'Course Completed';
        activityTitle = activity.sourceDetails?.title || 'Unknown Course';
        activityDescription = `Scored ${activity.score}% and earned ${activity.pointsAwarded} points`;
        icon = 'BookOpen';
        color = 'blue';
      } else if (activity.source === 'game') {
        activityType = 'Game Played';
        activityTitle = activity.details?.gameTitle || activity.sourceDetails?.title || 'Quiz Game';
        
        if (activity.details?.finalRank && activity.details?.totalPlayers) {
          const rank = activity.details.finalRank;
          const total = activity.details.totalPlayers;
          activityDescription = `Ranked #${rank} of ${total} players and earned ${activity.pointsAwarded} points`;
        } else {
          activityDescription = `Earned ${activity.pointsAwarded} points`;
        }
        
        icon = 'Gamepad2';
        color = 'green';
      } else {
        activityType = 'Achievement';
        activityTitle = 'Points Earned';
        activityDescription = `Earned ${activity.pointsAwarded} points`;
        icon = 'Trophy';
        color = 'yellow';
      }

      return {
        _id: activity._id,
        type: activityType,
        title: activityTitle,
        description: activityDescription,
        points: activity.pointsAwarded,
        date: activity.createdAt,
        icon,
        color
      };
    });

    // Get activity summary for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const summary = await Result.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: thirtyDaysAgo },
          pointsAwarded: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$source',
          totalPoints: { $sum: '$pointsAwarded' },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' }
        }
      }
    ]);

    const activitySummary = {
      totalPoints: summary.reduce((sum, item) => sum + item.totalPoints, 0),
      coursesCompleted: summary.find(item => item._id === 'course')?.count || 0,
      gamesPlayed: summary.find(item => item._id === 'game')?.count || 0,
      avgCourseScore: summary.find(item => item._id === 'course')?.avgScore || 0
    };

    return NextResponse.json({
      activities: formattedActivities,
      summary: activitySummary,
      total: formattedActivities.length
    });

  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
