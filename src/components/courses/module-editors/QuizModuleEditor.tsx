// src/components/courses/module-editors/QuizModuleEditor.tsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PlusCircle, HelpCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Question = {
  _id?: string; // Temp ID for React keys
  tempId?: string; // Alternative temp ID
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};

type QuizModuleEditorProps = {
  content: { questions: Question[] };
  onContentChange: (newContent: { questions: Question[] }) => void;
};

export function QuizModuleEditor({ content, onContentChange }: QuizModuleEditorProps) {
  const questions = content?.questions || [];

  const updateQuestion = (qIndex: number, updatedQuestion: Partial<Question>) => {
    const newQuestions = [...questions];
    newQuestions[qIndex] = { ...newQuestions[qIndex], ...updatedQuestion };
    onContentChange({ questions: newQuestions });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      tempId: `temp_q_${Date.now()}_${Math.random()}`,
      text: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
    };
    onContentChange({ questions: [...questions, newQuestion] });
  };

  const removeQuestion = (qIndex: number) => {
    const newQuestions = questions.filter((_, index) => index !== qIndex);
    onContentChange({ questions: newQuestions });
  };

  const updateOption = (qIndex: number, optionIndex: number, value: string) => {
    const question = questions[qIndex];
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    
    // If the correct answer was this option and it's being changed, clear the correct answer
    let newCorrectAnswer = question.correctAnswer;
    if (question.correctAnswer === question.options[optionIndex] && value !== question.options[optionIndex]) {
      newCorrectAnswer = "";
    }
    
    updateQuestion(qIndex, { options: newOptions, correctAnswer: newCorrectAnswer });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Quiz Questions ({questions.length})</h3>
        </div>
        <Button variant="outline" onClick={addQuestion} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Question
        </Button>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No questions yet</p>
              <p className="mb-4">Add your first question to get started with this quiz.</p>
              <Button onClick={addQuestion}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add First Question
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qIndex) => (
            <Card key={q._id || q.tempId || qIndex}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Question {qIndex + 1}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Text */}
                <div className="space-y-2">
                  <Label>Question Text</Label>
                  <Textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                    placeholder="Enter your question here..."
                    rows={2}
                  />
                </div>

                {/* Answer Options */}
                <div className="space-y-2">
                  <Label>Answer Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="relative">
                        <Input
                          value={opt}
                          onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          className={q.correctAnswer === opt && opt ? "border-green-500 bg-green-50" : ""}
                        />
                        {q.correctAnswer === opt && opt && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <span className="text-green-600 text-xs font-medium">✓ Correct</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correct Answer Selection */}
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Select
                    value={q.correctAnswer}
                    onValueChange={(value) => updateQuestion(qIndex, { correctAnswer: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {q.options.filter(opt => opt.trim()).map((opt, oIndex) => (
                        <SelectItem key={oIndex} value={opt}>
                          Option {oIndex + 1}: {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!q.correctAnswer && q.options.some(opt => opt.trim()) && (
                    <p className="text-sm text-amber-600">⚠️ Please select the correct answer</p>
                  )}
                </div>

                {/* Optional Explanation */}
                <div className="space-y-2">
                  <Label>Explanation (Optional)</Label>
                  <Textarea
                    value={q.explanation || ''}
                    onChange={(e) => updateQuestion(qIndex, { explanation: e.target.value })}
                    placeholder="Explain why this is the correct answer (shown to students after they answer)..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
