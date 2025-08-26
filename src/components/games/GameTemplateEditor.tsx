// src/components/games/GameTemplateEditor.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Play, Settings, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { QuizModuleEditor } from "@/components/courses/module-editors/QuizModuleEditor";

interface GameTemplateEditorProps {
  initialTemplate: any;
  userId: string;
}

export function GameTemplateEditor({ initialTemplate, userId }: GameTemplateEditorProps) {
  const router = useRouter();
  const [template, setTemplate] = useState(initialTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const isNew = template.isNew || template._id === 'new';

  const handleSave = async () => {
    if (!template.title.trim()) {
      toast.error("Please enter a game title");
      return;
    }

    if (!template.questions || template.questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    setIsSaving(true);
    try {
      const url = isNew ? '/api/games/templates' : `/api/games/templates/${template._id}`;
      const method = isNew ? 'POST' : 'PATCH';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: template.title,
          description: template.description,
          mechanics: template.mechanics,
          rules: template.rules,
          questions: template.questions
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save game template');
      }

      toast.success(isNew ? "Game template created!" : "Game template updated!");
      
      if (isNew) {
        router.push(`/games/manage/${data.templateId}/edit`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuestionChange = (questions: any[]) => {
    setTemplate((prev: any) => ({
      ...prev,
      questions
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/games/manage">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isNew ? "Create Game Template" : "Edit Game Template"}
            </h1>
            <p className="text-muted-foreground">
              Design a reusable template for live multiplayer games
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
          {!isNew && (
            <Button variant="outline" asChild>
              <Link href={`/games/host/${template._id}`}>
                <Play className="h-4 w-4 mr-2" />
                Host Game
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Set the title, description, and game type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Game Title *</Label>
            <Input
              id="title"
              placeholder="Enter a catchy game title..."
              value={template.title}
              onChange={(e) => setTemplate((prev: any) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this game is about..."
              value={template.description}
              onChange={(e) => setTemplate((prev: any) => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mechanics">Game Type</Label>
            <Select
              value={template.mechanics}
              onValueChange={(value) => setTemplate((prev: any) => ({ ...prev, mechanics: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz">Quiz Game</SelectItem>
                <SelectItem value="puzzle" disabled>Puzzle Game (Coming Soon)</SelectItem>
                <SelectItem value="trivia" disabled>Trivia Game (Coming Soon)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Game Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Game Rules & Scoring
          </CardTitle>
          <CardDescription>
            Configure how points are awarded and game mechanics work
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="basePoints">Base Points per Question</Label>
              <Input
                id="basePoints"
                type="number"
                min="1"
                max="1000"
                value={template.rules.basePoints}
                onChange={(e) => setTemplate((prev: any) => ({
                  ...prev,
                  rules: { ...prev.rules, basePoints: parseInt(e.target.value) || 100 }
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
              <Input
                id="timeLimit"
                type="number"
                min="5"
                max="300"
                value={template.rules.timeLimit}
                onChange={(e) => setTemplate((prev: any) => ({
                  ...prev,
                  rules: { ...prev.rules, timeLimit: parseInt(e.target.value) || 30 }
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeBonusMax">Max Time Bonus Points</Label>
              <Input
                id="timeBonusMax"
                type="number"
                min="0"
                max="500"
                value={template.rules.timeBonusMax}
                onChange={(e) => setTemplate((prev: any) => ({
                  ...prev,
                  rules: { ...prev.rules, timeBonusMax: parseInt(e.target.value) || 50 }
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hintCost">Hint Cost (points)</Label>
              <Input
                id="hintCost"
                type="number"
                min="0"
                max="100"
                value={template.rules.hintCost}
                onChange={(e) => setTemplate((prev: any) => ({
                  ...prev,
                  rules: { ...prev.rules, hintCost: parseInt(e.target.value) || 10 }
                }))}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Game Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Hints</Label>
                  <p className="text-sm text-muted-foreground">Players can use hints for points</p>
                </div>
                <Switch
                  checked={template.rules.allowHints}
                  onCheckedChange={(checked) => setTemplate((prev: any) => ({
                    ...prev,
                    rules: { ...prev.rules, allowHints: checked }
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Shuffle Questions</Label>
                  <p className="text-sm text-muted-foreground">Randomize question order</p>
                </div>
                <Switch
                  checked={template.rules.shuffleQuestions}
                  onCheckedChange={(checked) => setTemplate((prev: any) => ({
                    ...prev,
                    rules: { ...prev.rules, shuffleQuestions: checked }
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Shuffle Answers</Label>
                  <p className="text-sm text-muted-foreground">Randomize answer options</p>
                </div>
                <Switch
                  checked={template.rules.shuffleAnswers}
                  onCheckedChange={(checked) => setTemplate((prev: any) => ({
                    ...prev,
                    rules: { ...prev.rules, shuffleAnswers: checked }
                  }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Game Questions
          </CardTitle>
          <CardDescription>
            Add questions that will be used during live gameplay
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuizModuleEditor
            content={{ questions: template.questions || [] }}
            onContentChange={(newContent) => handleQuestionChange(newContent.questions)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
