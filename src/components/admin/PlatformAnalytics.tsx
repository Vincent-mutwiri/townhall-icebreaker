// src/components/admin/PlatformAnalytics.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  UserPlus, 
  Activity, 
  BookOpen, 
  Gamepad2, 
  MessageSquare,
  TrendingUp,
  Calendar,
  Trophy,
  Target,
  BarChart3,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AnalyticsData {
  userStats: {
    total: number;
    newThisMonth: number;
    activeThisWeek: number;
  };
  contentStats: {
    courses: number;
    games: number;
    posts: number;
  };
  activityStats: {
    totalResults: number;
    resultsThisMonth: number;
  };
  topUsers: Array<{
    _id: string;
    name: string;
    email: string;
    points: number;
    level: number;
    stats: {
      coursesCompleted: number;
      gamesPlayed: number;
    };
  }>;
  recentActivity: Array<{
    _id: string;
    source: string;
    score: number;
    pointsAwarded: number;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  dailyActivity: Array<{
    _id: string;
    count: number;
    totalPoints: number;
  }>;
}

interface PlatformAnalyticsProps {
  data: AnalyticsData;
}

export function PlatformAnalytics({ data }: PlatformAnalyticsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (source: string) => {
    switch (source) {
      case 'course': return <BookOpen className="h-4 w-4 text-blue-500" />;
      case 'game': return <Gamepad2 className="h-4 w-4 text-green-500" />;
      default: return <Trophy className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getActivityLabel = (source: string) => {
    switch (source) {
      case 'course': return 'Course Completed';
      case 'game': return 'Game Played';
      default: return 'Activity';
    }
  };

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">Monitor platform engagement and performance</p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            Back to Admin
          </Button>
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{data.userStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{data.userStats.newThisMonth}</div>
                <div className="text-sm text-muted-foreground">New This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{data.userStats.activeThisWeek}</div>
                <div className="text-sm text-muted-foreground">Active This Week</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{data.activityStats.resultsThisMonth}</div>
                <div className="text-sm text-muted-foreground">Activities This Month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{data.contentStats.courses}</div>
                <div className="text-sm text-muted-foreground">Total Courses</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{data.contentStats.games}</div>
                <div className="text-sm text-muted-foreground">Total Games</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{data.contentStats.posts}</div>
                <div className="text-sm text-muted-foreground">Community Posts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Users with the highest points and engagement
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topUsers.slice(0, 10).map((user, index) => (
                <div key={user._id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold">
                    #{index + 1}
                  </div>
                  
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.stats.coursesCompleted} courses • {user.stats.gamesPlayed} games
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{user.points}</div>
                    <div className="text-xs text-muted-foreground">Level {user.level}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest user activities across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentActivity.slice(0, 10).map((activity) => (
                <div key={activity._id} className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-gray-100">
                    {getActivityIcon(activity.source)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{activity.user.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {getActivityLabel(activity.source)}
                      {activity.score && ` • ${activity.score}% score`}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-green-600">+{activity.pointsAwarded}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(activity.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Daily Activity (Last 30 Days)
          </CardTitle>
          <CardDescription>
            Daily user activity and points awarded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.dailyActivity.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activity data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Activity Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Activities:</span>
                      <span className="font-semibold">
                        {data.dailyActivity.reduce((sum, day) => sum + day.count, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Points Awarded:</span>
                      <span className="font-semibold">
                        {data.dailyActivity.reduce((sum, day) => sum + day.totalPoints, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Daily Activities:</span>
                      <span className="font-semibold">
                        {Math.round(data.dailyActivity.reduce((sum, day) => sum + day.count, 0) / data.dailyActivity.length)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Peak Activity Days</h4>
                  <div className="space-y-2">
                    {data.dailyActivity
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 3)
                      .map((day, index) => (
                        <div key={day._id} className="flex justify-between">
                          <span className="text-sm">{day._id}:</span>
                          <span className="font-semibold">{day.count} activities</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
              
              {/* Simple activity visualization */}
              <div className="mt-6">
                <h4 className="font-semibold mb-4">Activity Timeline</h4>
                <div className="flex items-end gap-1 h-32 overflow-x-auto">
                  {data.dailyActivity.map((day) => {
                    const maxCount = Math.max(...data.dailyActivity.map(d => d.count));
                    const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    
                    return (
                      <div
                        key={day._id}
                        className="flex flex-col items-center min-w-[40px]"
                      >
                        <div
                          className="w-6 bg-blue-500 rounded-t"
                          style={{ height: `${height}%` }}
                          title={`${day._id}: ${day.count} activities, ${day.totalPoints} points`}
                        />
                        <div className="text-xs text-muted-foreground mt-1 transform -rotate-45 origin-left">
                          {day._id.split('-')[2]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
