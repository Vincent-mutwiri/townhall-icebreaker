"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Question = {
  _id: string;
  text: string;
  options: string[];
};

type QuestionViewProps = {
  question: Question;
  onAnswer: (answer: string) => void;
};

export function QuestionView({ question, onAnswer }: QuestionViewProps) {
  return (
    <Card className="w-full max-w-2xl animate-in fade-in">
      <CardHeader>
        <CardTitle className="text-center text-2xl md:text-3xl">
          {question.text}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto py-4 text-lg"
              onClick={() => onAnswer(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}