// src/lib/pointsEconomy.ts
import connectToDatabase from '@/lib/database';
import { Result } from '@/models/Result';
import { Setting } from '@/models/Setting';

interface PointsEconomySettings {
  dailyPointCap: number;
  weeklyPointCap: number;
  minPlayersForHostPoints: number;
}

export async function getPointsEconomySettings(): Promise<PointsEconomySettings> {
  await connectToDatabase();
  
  const settings = await Setting.find({
    key: { $in: ['dailyPointCap', 'weeklyPointCap', 'minPlayersForHostPoints'] }
  });

  const settingsMap = settings.reduce((acc, setting) => {
    acc[setting.key] = parseInt(setting.value) || 0;
    return acc;
  }, {} as Record<string, number>);

  return {
    dailyPointCap: settingsMap.dailyPointCap || 1000, // Default 1000 points per day
    weeklyPointCap: settingsMap.weeklyPointCap || 5000, // Default 5000 points per week
    minPlayersForHostPoints: settingsMap.minPlayersForHostPoints || 3 // Default minimum 3 players
  };
}

export async function checkPointsCap(userId: string, pointsToAward: number): Promise<{
  canAward: boolean;
  actualPoints: number;
  reason?: string;
}> {
  await connectToDatabase();
  
  const settings = await getPointsEconomySettings();
  const now = new Date();
  
  // Check daily cap (last 24 hours)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dailyPoints = await Result.aggregate([
    {
      $match: {
        userId: userId,
        createdAt: { $gte: dayAgo },
        pointsAwarded: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$pointsAwarded' }
      }
    }
  ]);

  const currentDailyPoints = dailyPoints[0]?.totalPoints || 0;
  
  // Check weekly cap (last 7 days)
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyPoints = await Result.aggregate([
    {
      $match: {
        userId: userId,
        createdAt: { $gte: weekAgo },
        pointsAwarded: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$pointsAwarded' }
      }
    }
  ]);

  const currentWeeklyPoints = weeklyPoints[0]?.totalPoints || 0;

  // Check if adding these points would exceed caps
  if (currentDailyPoints + pointsToAward > settings.dailyPointCap) {
    const remainingDaily = Math.max(0, settings.dailyPointCap - currentDailyPoints);
    return {
      canAward: remainingDaily > 0,
      actualPoints: remainingDaily,
      reason: remainingDaily === 0 ? 'Daily point cap reached' : 'Partial points due to daily cap'
    };
  }

  if (currentWeeklyPoints + pointsToAward > settings.weeklyPointCap) {
    const remainingWeekly = Math.max(0, settings.weeklyPointCap - currentWeeklyPoints);
    return {
      canAward: remainingWeekly > 0,
      actualPoints: remainingWeekly,
      reason: remainingWeekly === 0 ? 'Weekly point cap reached' : 'Partial points due to weekly cap'
    };
  }

  return {
    canAward: true,
    actualPoints: pointsToAward
  };
}

export async function checkGameHostEligibility(playerCount: number): Promise<{
  canAwardHostPoints: boolean;
  reason?: string;
}> {
  const settings = await getPointsEconomySettings();
  
  if (playerCount < settings.minPlayersForHostPoints) {
    return {
      canAwardHostPoints: false,
      reason: `Minimum ${settings.minPlayersForHostPoints} players required for host points`
    };
  }

  return {
    canAwardHostPoints: true
  };
}
