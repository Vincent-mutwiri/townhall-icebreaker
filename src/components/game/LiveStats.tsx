"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSocket } from "@/context/SocketProvider";

type LiveStatsProps = {
  pin: string;
  totalPlayers: number;
  currentRound: number;
  averageResponseTime?: number;
  fastestResponse?: { playerName: string; time: number };
};

type StatsData = {
  playersAnswered: number;
  correctAnswers: number;
  averageTime: number;
  fastestPlayer?: { name: string; time: number };
};

export function LiveStats({ pin, totalPlayers, currentRound, averageResponseTime, fastestResponse }: LiveStatsProps) {
  const { socket } = useSocket();
  const [liveStats, setLiveStats] = useState<StatsData>({
    playersAnswered: 0,
    correctAnswers: 0,
    averageTime: 0,
  });

  useEffect(() => {
    if (!socket) return;

    const handleLiveStats = (stats: StatsData) => {
      setLiveStats(stats);
    };

    socket.on('live-stats', handleLiveStats);

    return () => {
      socket.off('live-stats', handleLiveStats);
    };
  }, [socket]);

  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const answerProgress = totalPlayers > 0 ? (liveStats.playersAnswered / totalPlayers) * 100 : 0;
  const accuracyRate = liveStats.playersAnswered > 0 ? (liveStats.correctAnswers / liveStats.playersAnswered) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Round Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Answered</span>
              <span>{liveStats.playersAnswered}/{totalPlayers}</span>
            </div>
            <Progress value={answerProgress} className="h-2" />
            <Badge variant="outline" className="text-xs">
              Round {currentRound}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600">
              {accuracyRate.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {liveStats.correctAnswers} correct answers
            </div>
            <Progress value={accuracyRate} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Response Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-600">
              {liveStats.averageTime > 0 ? formatTime(liveStats.averageTime) : '--'}
            </div>
            <div className="text-xs text-muted-foreground">
              Average response time
            </div>
            {averageResponseTime && (
              <div className="text-xs">
                Last round: {formatTime(averageResponseTime)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Fastest Player</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(liveStats.fastestPlayer || fastestResponse) ? (
              <>
                <div className="text-lg font-bold text-purple-600">
                  {liveStats.fastestPlayer?.name || fastestResponse?.playerName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatTime(liveStats.fastestPlayer?.time || fastestResponse?.time || 0)}
                </div>
                <Badge variant="secondary" className="text-xs">
                  🏆 Speed Champion
                </Badge>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Waiting for responses...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}