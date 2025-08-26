// src/components/courses/QuizPlayer.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, RotateCcw, Trophy } from "lucide-react";

type QuizPlayerProps = {
  module: any;
  onComplete: (points: number) => void;
  isCompleted?: boolean;
  previousScore?: number;
};

export function QuizPlayer({ module, onComplete, isCompleted = false, previousScore }: QuizPlayerProps) {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(isCompleted);
  const [answers, setAnswers] = useState<string[]>([]);

  const questions = module.content?.questions || [];
  const question = questions[currentQIndex];
  const isCorrect = selectedAnswer === question?.correctAnswer;
  const progress = ((currentQIndex + (isAnswered ? 1 : 0)) / questions.length) * 100;

  if (!questions.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            <p>This quiz has no questions yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAnswer = (answer: string) => {
    if (isAnswered || quizCompleted) return;
    
    setSelectedAnswer(answer);
    setIsAnswered(true);
    
    const newAnswers = [...answers];
    newAnswers[currentQIndex] = answer;
    setAnswers(newAnswers);
    
    if (answer === question.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      // Move to next question
      setCurrentQIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
    } else {
      // Quiz finished
      const finalScore = score + (isCorrect ? 1 : 0);
      const percentage = Math.round((finalScore / questions.length) * 100);
      const points = Math.max(10, percentage); // Minimum 10 points, max 100
      
      setQuizCompleted(true);
      onComplete(points);
    }
  };

  const handleRetake = () => {
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setScore(0);
    setQuizCompleted(false);
    setAnswers([]);
  };

  if (quizCompleted) {
    const finalScore = score;
    const percentage = Math.round((finalScore / questions.length) * 100);
    const points = previousScore || Math.max(10, percentage);

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Trophy className="h-16 w-16 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{finalScore}</div>
                <div className="text-sm text-gray-600">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{questions.length - finalScore}</div>
                <div className="text-sm text-gray-600">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 font-medium">Points Earned: {points}</p>
            </div>
          </div>

          {!isCompleted && (
            <div className="flex justify-center">
              <Button onClick={handleRetake} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Question {currentQIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{question.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Options */}
          <div className="space-y-3">
            {question.options?.map((option: string, index: number) => {
              if (!option.trim()) return null;
              
              let buttonClass = "w-full justify-start h-auto py-4 px-4 text-left";
              let icon = null;
              
              if (isAnswered) {
                if (option === question.correctAnswer) {
                  buttonClass += " bg-green-100 border-green-400 text-green-800 hover:bg-green-100";
                  icon = <CheckCircle className="h-5 w-5 text-green-600" />;
                } else if (selectedAnswer === option) {
                  buttonClass += " bg-red-100 border-red-400 text-red-800 hover:bg-red-100";
                  icon = <XCircle className="h-5 w-5 text-red-600" />;
                } else {
                  buttonClass += " opacity-60";
                }
              } else {
                buttonClass += " hover:bg-gray-50 border-gray-200";
              }

              return (
                <Button
                  key={index}
                  variant="outline"
                  className={cn(buttonClass)}
                  onClick={() => handleAnswer(option)}
                  disabled={isAnswered}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {icon}
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Feedback */}
          {isAnswered && (
            <div className="mt-6 p-4 rounded-lg border">
              <div className={`flex items-center gap-2 mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="font-medium">
                  {isCorrect ? "Correct!" : "Incorrect"}
                </span>
              </div>
              
              {!isCorrect && (
                <p className="text-sm text-gray-600 mb-2">
                  The correct answer is: <strong>{question.correctAnswer}</strong>
                </p>
              )}
              
              {question.explanation && (
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {isAnswered && (
            <div className="flex justify-end pt-4">
              <Button onClick={handleNext}>
                {currentQIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Score Display */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>Current Score: {score}/{currentQIndex + (isAnswered && isCorrect ? 1 : 0)}</span>
        <Badge variant="outline">
          {Math.round((score / Math.max(1, currentQIndex + (isAnswered ? 1 : 0))) * 100)}% correct
        </Badge>
      </div>
    </div>
  );
}
