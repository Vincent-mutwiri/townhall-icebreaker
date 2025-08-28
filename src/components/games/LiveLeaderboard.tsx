// src/components/games/LiveLeaderboard.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Trophy, ArrowRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveLeaderboardProps {
  leaderboardData: any[];
  currentQuestionIndex: number;
  totalQuestions: number;
  isHost: boolean;
  onNextQuestion: () => void;
}

export function LiveLeaderboard({ 
  leaderboardData, 
  currentQuestionIndex, 
  totalQuestions, 
  isHost, 
  onNextQuestion 
}: LiveLeaderboardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">Current Standings</h1>
          </div>
          <p className="text-gray-600">
            After Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{currentQuestionIndex + 1} / {totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Leaderboard */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboardData.map((player: any, index: number) => (
                <div 
                  key={player.userId} 
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg transition-all duration-300",
                    index === 0 ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 shadow-lg" :
                    index === 1 ? "bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-300 shadow-md" :
                    index === 2 ? "bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-300 shadow-md" :
                    "bg-gray-50 border border-gray-200"
                  )}
                >
                  {/* Rank */}
                  <div className="flex-shrink-0">
                    {index < 3 ? (
                      <Crown className={cn(
                        "h-8 w-8",
                        index === 0 ? "text-yellow-500" : 
                        index === 1 ? "text-gray-400" : "text-amber-600"
                      )} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-600">#{index + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{player.name}</div>
                    <div className="text-sm text-gray-600">
                      {player.correctAnswers || 0} correct answers
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{player.score}</div>
                    <div className="text-sm text-gray-600">points</div>
                  </div>

                  {/* Winner Badge */}
                  {index === 0 && (
                    <Badge className="bg-yellow-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Leading
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Next Question Button (Host Only) */}
        {isHost && currentQuestionIndex < totalQuestions - 1 && (
          <div className="text-center">
            <Button 
              onClick={onNextQuestion} 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3"
            >
              <ArrowRight className="mr-2 h-5 w-5" />
              Next Question
            </Button>
          </div>
        )}

        {/* Game Finished Message */}
        {currentQuestionIndex >= totalQuestions - 1 && (
          <div className="text-center">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="pt-6">
                <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Game Complete!</h2>
                <p className="text-gray-600">
                  Congratulations to all players! Final results are displayed above.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waiting Message for Non-Host */}
        {!isHost && currentQuestionIndex < totalQuestions - 1 && (
          <div className="text-center">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <Crown className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-700 font-medium">
                    Waiting for host to start the next question...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
