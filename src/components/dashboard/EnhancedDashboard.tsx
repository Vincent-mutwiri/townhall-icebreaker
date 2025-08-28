// src/components/dashboard/EnhancedDashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Star, 
  BookOpen, 
  Gamepad2, 
  TrendingUp, 
  Calendar,
  Award,
  Zap,
  Target,
  Clock,
  Users,
  Crown,
  Medal,
  Gift
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface UserActivity {
  _id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  date: string;
  icon: string;
  color: string;
}

interface ActivitySummary {
  totalPoints: number;
  coursesCompleted: number;
  gamesPlayed: number;
  avgCourseScore: number;
}

interface EnhancedDashboardProps {
  userData: any;
  session: any;
}

export function EnhancedDashboard({ userData, session }: EnhancedDashboardProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserActivity();
  }, []);

  const fetchUserActivity = async () => {
    try {
      const response = await fetch('/api/me/activity?limit=10');
      if (!response.ok) {
        throw new Error('Failed to fetch activity');
      }
      
      const data = await response.json();
      setActivities(data.activities);
      setActivitySummary(data.summary);
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast.error('Failed to load recent activity');
    } finally {
      setLoading(false);
    }
  };

  // Calculate level progress
  const currentLevel = userData.level || 1;
  const currentXP = userData.points || 0;
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = Math.min((xpProgress / xpNeeded) * 100, 100);

  const getActivityIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      BookOpen,
      Gamepad2,
      Trophy,
      Star,
      Award
    };
    const IconComponent = iconMap[iconName] || Trophy;
    return IconComponent;
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'text-blue-500',
      green: 'text-green-500',
      yellow: 'text-yellow-500',
      purple: 'text-purple-500',
      red: 'text-red-500'
    };
    return colorMap[color] || 'text-gray-500';
  };

  const getBadgeIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Trophy,
      Star,
      Crown,
      Medal,
      Award,
      Gift,
      Target
    };
    const IconComponent = iconMap[iconName] || Trophy;
    return IconComponent;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback className="text-lg sm:text-xl bg-blue-100 text-blue-700">
              {userData.name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back, {userData.name}!</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Ready to continue your learning journey?
            </p>
          </div>
        </div>
      </div>

        <div className="grid gap-4 md:gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Left Column - Stats and Progress */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Level and XP Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Level & Progress
                </CardTitle>
                <CardDescription>
                  Your learning journey progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">Level {currentLevel}</div>
                      <div className="text-sm text-gray-600">
                        {currentXP.toLocaleString()} total XP
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {xpProgress}/{xpNeeded} XP
                      </div>
                      <div className="text-sm text-gray-600">
                        to Level {currentLevel + 1}
                      </div>
                    </div>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
              <Card>
                <CardContent className="p-3 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">{userData.points || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Total Points</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">{userData.stats?.coursesCompleted || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Courses</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">{userData.stats?.gamesPlayed || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Games</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                    <div>
                      <div className="text-lg sm:text-2xl font-bold text-gray-900">{userData.badges?.length || 0}</div>
                      <div className="text-xs sm:text-sm text-gray-600">Badges</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest achievements and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activity</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Start learning to see your progress here!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 5).map((activity) => {
                      const IconComponent = getActivityIcon(activity.icon);
                      return (
                        <div key={activity._id} className="flex items-start sm:items-center gap-3 sm:gap-4 p-3 rounded-lg bg-gray-50">
                          <div className={cn("p-2 rounded-full bg-white flex-shrink-0", getColorClass(activity.color))}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 text-sm sm:text-base">{activity.title}</div>
                            <div className="text-xs sm:text-sm text-gray-600 truncate">{activity.description}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold text-green-600 text-sm">+{activity.points}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(activity.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {activities.length > 5 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm">
                          View All Activity
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Badges and Quick Actions */}
          <div className="space-y-4 md:space-y-6">
            {/* Earned Badges */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Your Badges
                </CardTitle>
                <CardDescription>
                  Achievements you've unlocked
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userData.badges && userData.badges.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {userData.badges.map((badge: any) => {
                      const IconComponent = getBadgeIcon(badge.icon);
                      return (
                        <div
                          key={badge._id}
                          className="flex flex-col items-center p-2 sm:p-3 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200"
                        >
                          <IconComponent className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mb-1 sm:mb-2" />
                          <div className="text-xs font-medium text-center leading-tight">{badge.name}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No badges yet</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Complete courses and games to earn your first badge!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Jump into learning or competition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full">
                  <Link href="/courses">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Browse Courses
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/games">
                    <Gamepad2 className="mr-2 h-4 w-4" />
                    Play Games
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/leaderboard">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Leaderboard
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/updates">
                    <Users className="mr-2 h-4 w-4" />
                    Community Updates
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Monthly Summary */}
            {activitySummary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    This Month
                  </CardTitle>
                  <CardDescription>
                    Your activity in the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Points Earned</span>
                    <span className="font-semibold">{activitySummary.totalPoints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Courses Completed</span>
                    <span className="font-semibold">{activitySummary.coursesCompleted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Games Played</span>
                    <span className="font-semibold">{activitySummary.gamesPlayed}</span>
                  </div>
                  {activitySummary.avgCourseScore > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Course Score</span>
                      <span className="font-semibold">{Math.round(activitySummary.avgCourseScore)}%</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
    </div>
  );
}
