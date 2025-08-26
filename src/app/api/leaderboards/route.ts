// src/app/api/leaderboards/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/database';
import { User } from '@/models/User';
import { Result } from '@/models/Result';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'all-time'; // all-time, weekly, monthly
    const category = searchParams.get('category') || 'points'; // points, courses, games
    const limit = parseInt(searchParams.get('limit') || '50');
    const currentUserId = (session.user as any).id;

    let leaderboardData = [];

    if (scope === 'all-time' && category === 'points') {
      // All-time points leaderboard - simple query on User collection
      leaderboardData = await User.aggregate([
        {
          $match: {
            points: { $gt: 0 } // Only users with points
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            avatar: 1,
            points: 1,
            level: 1,
            'stats.coursesCompleted': 1,
            'stats.gamesPlayed': 1
          }
        },
        {
          $sort: { points: -1 }
        },
        {
          $limit: limit
        }
      ]);

      // Add rank manually
      leaderboardData = leaderboardData.map((user, index) => ({
        ...user,
        rank: index + 1,
        isCurrentUser: user._id.toString() === currentUserId
      }));

    } else if (scope === 'weekly' && category === 'points') {
      // Weekly points leaderboard - aggregate from Result collection
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyResults = await Result.aggregate([
        {
          $match: {
            createdAt: { $gte: weekAgo },
            pointsAwarded: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$userId',
            weeklyPoints: { $sum: '$pointsAwarded' },
            activitiesCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            avatar: '$user.avatar',
            points: '$weeklyPoints',
            activitiesCount: 1,
            totalPoints: '$user.points',
            level: '$user.level'
          }
        },
        {
          $sort: { points: -1 }
        },
        {
          $limit: limit
        }
      ]);

      leaderboardData = weeklyResults.map((user, index) => ({
        ...user,
        rank: index + 1,
        isCurrentUser: user._id.toString() === currentUserId
      }));

    } else if (scope === 'monthly' && category === 'points') {
      // Monthly points leaderboard
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const monthlyResults = await Result.aggregate([
        {
          $match: {
            createdAt: { $gte: monthAgo },
            pointsAwarded: { $gt: 0 }
          }
        },
        {
          $group: {
            _id: '$userId',
            monthlyPoints: { $sum: '$pointsAwarded' },
            activitiesCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            avatar: '$user.avatar',
            points: '$monthlyPoints',
            activitiesCount: 1,
            totalPoints: '$user.points',
            level: '$user.level'
          }
        },
        {
          $sort: { points: -1 }
        },
        {
          $limit: limit
        }
      ]);

      leaderboardData = monthlyResults.map((user, index) => ({
        ...user,
        rank: index + 1,
        isCurrentUser: user._id.toString() === currentUserId
      }));

    } else if (category === 'courses') {
      // Courses completed leaderboard
      leaderboardData = await User.aggregate([
        {
          $match: {
            'stats.coursesCompleted': { $gt: 0 }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            avatar: 1,
            points: '$stats.coursesCompleted',
            totalPoints: '$points',
            level: 1,
            'stats.coursesCompleted': 1
          }
        },
        {
          $sort: { 'stats.coursesCompleted': -1, totalPoints: -1 }
        },
        {
          $limit: limit
        }
      ]);

      leaderboardData = leaderboardData.map((user, index) => ({
        ...user,
        rank: index + 1,
        isCurrentUser: user._id.toString() === currentUserId
      }));

    } else if (category === 'games') {
      // Games played leaderboard
      leaderboardData = await User.aggregate([
        {
          $match: {
            'stats.gamesPlayed': { $gt: 0 }
          }
        },
        {
          $project: {
            _id: 1,
            name: 1,
            email: 1,
            avatar: 1,
            points: '$stats.gamesPlayed',
            totalPoints: '$points',
            level: 1,
            'stats.gamesPlayed': 1
          }
        },
        {
          $sort: { 'stats.gamesPlayed': -1, totalPoints: -1 }
        },
        {
          $limit: limit
        }
      ]);

      leaderboardData = leaderboardData.map((user, index) => ({
        ...user,
        rank: index + 1,
        isCurrentUser: user._id.toString() === currentUserId
      }));
    }

    // Find current user's position if they're not in the top results
    let currentUserRank = null;
    const currentUserInResults = leaderboardData.find(user => user.isCurrentUser);

    if (!currentUserInResults && scope === 'all-time' && category === 'points') {
      const currentUser = await User.findById(currentUserId);
      if (currentUser && currentUser.points > 0) {
        const usersAbove = await User.countDocuments({
          points: { $gt: currentUser.points }
        });
        currentUserRank = {
          rank: usersAbove + 1,
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          points: currentUser.points,
          level: currentUser.level,
          isCurrentUser: true
        };
      }
    }

    return NextResponse.json({
      leaderboard: leaderboardData,
      currentUserRank,
      scope,
      category,
      total: leaderboardData.length
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
