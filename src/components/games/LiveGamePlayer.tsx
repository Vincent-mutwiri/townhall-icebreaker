// src/components/games/LiveGamePlayer.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Trophy, 
  Users, 
  Crown,
  CheckCircle,
  XCircle,
  ArrowRight,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { cn } from "@/lib/utils";

interface LiveGamePlayerProps {
  gameData: any;
  userId: string;
}

type GameState = 'waiting' | 'question' | 'results' | 'leaderboard' | 'finished';

export function LiveGamePlayer({ gameData, userId }: LiveGamePlayerProps) {
  const router = useRouter();
  const socket = useSocket();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>('waiting');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [players, setPlayers] = useState(gameData.players || []);
  const [roundResults, setRoundResults] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!socket) return;

    // Join the game room and authenticate
    socket.emit('join-room', gameData.joinCode);
    socket.emit('authenticate', userId);

    // Listen for game events
    socket.on('game:question', (data) => {
      setCurrentQuestion(data.question);
      setTimeRemaining(data.timeLimit);
      setCurrentQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setGameState('question');
      setSelectedAnswer(null);
      setHasAnswered(false);
      setRoundResults(null);
    });

    socket.on('game:round-results', (data) => {
      setRoundResults(data);
      setPlayers(data.players);
      setGameState('results');
    });

    socket.on('game:leaderboard', (data) => {
      setLeaderboard(data.leaderboard);
      setGameState('leaderboard');
    });

    socket.on('game:finished', (data) => {
      setLeaderboard(data.finalLeaderboard);
      setPlayers(data.players);
      setGameState('finished');
    });

    socket.on('game:next-question', (data) => {
      // Brief pause before next question
      setTimeout(() => {
        setCurrentQuestion(data.question);
        setTimeRemaining(data.timeLimit);
        setCurrentQuestionIndex(data.questionIndex);
        setGameState('question');
        setSelectedAnswer(null);
        setHasAnswered(false);
        setRoundResults(null);
      }, 2000);
    });

    // Timer countdown
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (gameState === 'question' && !hasAnswered) {
            // Auto-submit no answer when time runs out
            handleAnswerSubmit(null);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      socket.off('game:question');
      socket.off('game:round-results');
      socket.off('game:leaderboard');
      socket.off('game:finished');
      socket.off('game:next-question');
      clearInterval(timer);
    };
  }, [socket, gameData.joinCode, gameState, hasAnswered]);

  const handleAnswerSubmit = (answer: string | null) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answer);
    setHasAnswered(true);
    
    // Send answer to server
    socket?.emit('player:answer', {
      joinCode: gameData.joinCode,
      answer,
      timeRemaining,
      timestamp: Date.now()
    });
  };

  const handleNextRound = () => {
    if (gameData.isHost) {
      socket?.emit('host:next-question', gameData.joinCode);
    }
  };

  const currentPlayer = players.find((p: any) => p.userId === userId);
  const timeProgress = currentQuestion ? ((currentQuestion.timeLimit - timeRemaining) / currentQuestion.timeLimit) * 100 : 0;

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold mb-2">Game Starting...</h2>
            <p className="text-muted-foreground">Get ready for the first question!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (gameState === 'question' && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </Badge>
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="font-medium">{currentPlayer?.score || 0} points</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-500" />
              <span className={cn(
                "text-2xl font-bold",
                timeRemaining <= 5 ? "text-red-500 animate-pulse" : "text-gray-700"
              )}>
                {timeRemaining}s
              </span>
            </div>
          </div>

          {/* Timer Progress */}
          <Progress value={timeProgress} className="h-2 mb-8" />

          {/* Question */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center">{currentQuestion.text}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {currentQuestion.options?.map((option: string, index: number) => {
                  if (!option.trim()) return null;
                  
                  const isSelected = selectedAnswer === option;
                  const isDisabled = hasAnswered || timeRemaining === 0;
                  
                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "h-auto py-6 px-6 text-left justify-start",
                        isSelected && "ring-2 ring-blue-500",
                        isDisabled && "opacity-60"
                      )}
                      onClick={() => handleAnswerSubmit(option)}
                      disabled={isDisabled}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="flex-1 text-base">{option}</span>
                        {isSelected && <CheckCircle className="h-5 w-5" />}
                      </div>
                    </Button>
                  );
                })}
              </div>
              
              {hasAnswered && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                    Answer submitted! Waiting for other players...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Player Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {players.map((player: any) => (
                  <div key={player.userId} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {player.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{player.name}</div>
                      <div className="text-xs text-muted-foreground">{player.score || 0} pts</div>
                    </div>
                    {player.hasAnswered && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (gameState === 'results' && roundResults) {
    const isCorrect = roundResults.correctAnswer === selectedAnswer;
    const pointsEarned = roundResults.playerResults?.find((p: any) => p.userId === userId)?.pointsEarned || 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-8">
            <div className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold mb-4",
              isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            )}>
              {isCorrect ? <CheckCircle className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              {isCorrect ? "Correct!" : "Incorrect"}
            </div>
            
            {pointsEarned > 0 && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full">
                <Zap className="h-4 w-4" />
                +{pointsEarned} points earned!
              </div>
            )}
          </div>

          {/* Correct Answer */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Correct Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-medium text-green-800">{roundResults.correctAnswer}</p>
              </div>
              {roundResults.explanation && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{roundResults.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Round Leaderboard */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Round Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roundResults.playerResults?.map((result: any, index: number) => (
                  <div key={result.userId} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0">
                      {index < 3 ? (
                        <Crown className={cn(
                          "h-5 w-5",
                          index === 0 ? "text-yellow-500" : 
                          index === 1 ? "text-gray-400" : "text-amber-600"
                        )} />
                      ) : (
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{result.playerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {result.isCorrect ? "Correct" : "Incorrect"} • {result.responseTime}ms
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">+{result.pointsEarned}</div>
                      <div className="text-sm text-muted-foreground">{result.totalScore} total</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Question Button (Host Only) */}
          {gameData.isHost && (
            <div className="text-center">
              <Button onClick={handleNextRound} size="lg">
                <ArrowRight className="mr-2 h-5 w-5" />
                Next Question
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Game Finished Header */}
          <div className="mb-8">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Game Complete!</h1>
            <p className="text-muted-foreground">Thanks for playing!</p>
          </div>

          {/* Final Leaderboard */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Final Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((player: any, index: number) => (
                  <div key={player.userId} className={cn(
                    "flex items-center gap-4 p-4 rounded-lg",
                    index === 0 ? "bg-yellow-50 border-2 border-yellow-200" :
                    index === 1 ? "bg-gray-50 border-2 border-gray-200" :
                    index === 2 ? "bg-amber-50 border-2 border-amber-200" :
                    "bg-gray-50"
                  )}>
                    <div className="flex-shrink-0">
                      {index < 3 ? (
                        <Crown className={cn(
                          "h-8 w-8",
                          index === 0 ? "text-yellow-500" : 
                          index === 1 ? "text-gray-400" : "text-amber-600"
                        )} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="font-medium text-gray-600">#{index + 1}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-lg">{player.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {player.correctAnswers}/{totalQuestions} correct
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{player.score}</div>
                      <div className="text-sm text-muted-foreground">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={() => router.push('/games')}>
              Play Another Game
            </Button>
            <Button onClick={() => router.push('/courses')}>
              Explore Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
