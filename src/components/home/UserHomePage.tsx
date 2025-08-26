'use client';

import React, { useState, useEffect } from 'react';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BookOpen, 
  Gamepad2, 
  Trophy, 
  MessageSquare, 
  Megaphone,
  TrendingUp,
  Clock,
  Star,
  Award,
  Zap,
  Calendar,
  ArrowRight,
  Users,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface UserHomePageProps {
  session: any;
  announcements: any[];
}

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  href: string;
}

export function UserHomePage({ session, announcements }: UserHomePageProps) {
  const [userStats, setUserStats] = useState({
    points: 0,
    level: 1,
    coursesCompleted: 0,
    gamesPlayed: 0,
    badges: 0,
    streak: 0
  });

  const user = session.user;
  const currentLevel = userStats.level;
  const currentXP = userStats.points;
  const xpForCurrentLevel = (currentLevel - 1) * 1000;
  const xpForNextLevel = currentLevel * 1000;
  const xpProgress = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = Math.min((xpProgress / xpNeeded) * 100, 100);

  const quickStats: QuickStat[] = [
    {
      label: 'Courses',
      value: userStats.coursesCompleted,
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-100',
      href: '/courses'
    },
    {
      label: 'Games',
      value: userStats.gamesPlayed,
      icon: <Gamepad2 className="h-5 w-5" />,
      color: 'text-green-600 bg-green-100',
      href: '/games'
    },
    {
      label: 'Badges',
      value: userStats.badges,
      icon: <Award className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-100',
      href: '/dashboard'
    },
    {
      label: 'Points',
      value: userStats.points,
      icon: <Zap className="h-5 w-5" />,
      color: 'text-yellow-600 bg-yellow-100',
      href: '/leaderboard'
    }
  ];

  const quickActions = [
    {
      title: 'Continue Learning',
      description: 'Pick up where you left off',
      icon: <BookOpen className="h-6 w-6" />,
      href: '/courses',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Play Games',
      description: 'Test your knowledge',
      icon: <Gamepad2 className="h-6 w-6" />,
      href: '/games',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'View Progress',
      description: 'Check your achievements',
      icon: <Trophy className="h-6 w-6" />,
      href: '/dashboard',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Join Community',
      description: 'Connect with others',
      icon: <MessageSquare className="h-6 w-6" />,
      href: '/updates',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-white/20">
              <AvatarImage src={(user as any)?.avatar} />
              <AvatarFallback className="text-2xl bg-white/20 text-white">
                {user?.name?.charAt(0) || user?.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name || 'Learner'}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Ready to continue your learning journey?
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Level {currentLevel}</div>
              <div className="text-blue-100">
                {userStats.points.toLocaleString()} XP
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-blue-100 mb-2">
              <span>Level {currentLevel}</span>
              <span>{xpProgress}/{xpNeeded} XP to Level {currentLevel + 1}</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-white/20" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => (
            <Link key={index} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", stat.color)}>
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4", action.color)}>
                      {action.icon}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{action.description}</p>
                    <div className="flex items-center text-sm font-medium text-blue-600">
                      Get Started <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Announcements */}
        {announcements && announcements.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Latest Announcements</h2>
              <Link href="/announcements">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {announcements.slice(0, 2).map((announcement) => (
                <Card key={announcement._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Megaphone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2 text-gray-900">
                          {announcement.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                          {new Date(announcement.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 line-clamp-3 mb-4">
                      {announcement.content.substring(0, 150)}...
                    </p>
                    <Link href="/announcements">
                      <Button variant="outline" size="sm">
                        Read More
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Learning Streak */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Target className="h-5 w-5 text-orange-500" />
              Keep Your Streak Going!
            </CardTitle>
            <CardDescription className="text-gray-600">
              Consistency is key to mastering new skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-orange-600">{userStats.streak}</div>
                <div className="text-sm text-gray-600">Day streak</div>
              </div>
              <div className="flex gap-2">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                      i < userStats.streak 
                        ? "bg-orange-500 text-white" 
                        : "bg-gray-200 text-gray-500"
                    )}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
