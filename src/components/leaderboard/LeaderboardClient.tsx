// src/components/leaderboard/LeaderboardClient.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  TrendingUp, 
  Calendar,
  Clock,
  BookOpen,
  Gamepad2,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  totalPoints?: number;
  level: number;
  rank: number;
  isCurrentUser: boolean;
  activitiesCount?: number;
  stats?: {
    coursesCompleted: number;
    gamesPlayed: number;
  };
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUserRank?: LeaderboardEntry;
  scope: string;
  category: string;
  total: number;
}

export function LeaderboardClient() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('all-time');
  const [category, setCategory] = useState('points');

  const fetchLeaderboard = async (newScope?: string, newCategory?: string) => {
    setLoading(true);
    try {
      const currentScope = newScope || scope;
      const currentCategory = newCategory || category;
      
      const response = await fetch(`/api/leaderboards?scope=${currentScope}&category=${currentCategory}&limit=50`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const handleScopeChange = (newScope: string) => {
    setScope(newScope);
    fetchLeaderboard(newScope, category);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    fetchLeaderboard(scope, newCategory);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getScopeIcon = (scopeType: string) => {
    switch (scopeType) {
      case 'weekly': return <Calendar className="h-4 w-4" />;
      case 'monthly': return <TrendingUp className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (categoryType: string) => {
    switch (categoryType) {
      case 'courses': return <BookOpen className="h-4 w-4" />;
      case 'games': return <Gamepad2 className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (categoryType: string, scopeType: string) => {
    if (categoryType === 'courses') return 'Courses Completed';
    if (categoryType === 'games') return 'Games Played';
    if (scopeType === 'weekly') return 'Weekly Points';
    if (scopeType === 'monthly') return 'Monthly Points';
    return 'Total Points';
  };

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-foreground">
          See how you rank against your peers and climb to the top!
        </p>
      </div>

      {/* Controls */}
      <div className="mb-8">
        <Tabs value={scope} onValueChange={handleScopeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="all-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              All Time
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="weekly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Weekly
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex justify-center mt-4">
          <div className="flex gap-2">
            <Button
              variant={category === 'points' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('points')}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Points
            </Button>
            <Button
              variant={category === 'courses' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('courses')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Courses
            </Button>
            <Button
              variant={category === 'games' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCategoryChange('games')}
              className="flex items-center gap-2"
            >
              <Gamepad2 className="h-4 w-4" />
              Games
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current User Rank (if not in top 50) */}
          {data?.currentUserRank && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                    <span className="text-lg font-bold text-blue-600">
                      #{data.currentUserRank.rank}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{data.currentUserRank.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {data.currentUserRank.points} {getCategoryLabel(category, scope).toLowerCase()}
                    </div>
                  </div>
                  <Badge variant="secondary">You</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getScopeIcon(scope)}
                {getCategoryLabel(category, scope)} Leaderboard
              </CardTitle>
              <CardDescription>
                Top performers {scope === 'all-time' ? 'of all time' : `this ${scope.replace('-', ' ')}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No data available for this category yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Be the first to earn points and claim the top spot!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.leaderboard.map((entry) => (
                    <div
                      key={entry._id}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg transition-colors",
                        entry.isCurrentUser 
                          ? "bg-blue-50 border-2 border-blue-200" 
                          : "bg-gray-50 hover:bg-gray-100",
                        entry.rank <= 3 && "ring-2 ring-yellow-200"
                      )}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12">
                        {getRankIcon(entry.rank)}
                      </div>

                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={entry.avatar} alt={entry.name} />
                        <AvatarFallback>
                          {entry.name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{entry.name}</span>
                          {entry.isCurrentUser && (
                            <Badge variant="secondary">You</Badge>
                          )}
                          {entry.level && (
                            <Badge variant="outline" className="text-xs">
                              Level {entry.level}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {entry.activitiesCount && (
                            <span>{entry.activitiesCount} activities • </span>
                          )}
                          {entry.totalPoints && entry.totalPoints !== entry.points && (
                            <span>{entry.totalPoints} total points</span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          {entry.points.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getCategoryLabel(category, scope).toLowerCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
