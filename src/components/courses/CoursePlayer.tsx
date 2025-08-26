// src/components/courses/CoursePlayer.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Lock, PlayCircle, BookOpen, HelpCircle, ArrowLeft, ArrowRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { QuizPlayer } from "./QuizPlayer"; // We will create this next
import Link from "next/link";

export function CoursePlayer({ course, userId }: { course: any, userId: string }) {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  // In a real app, you'd fetch user progress from the DB
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [moduleScores, setModuleScores] = useState<Record<string, number>>({});

  const activeModule = course.modules[activeModuleIndex];
  const progress = (completedModules.length / course.modules.length) * 100;

  const handleModuleComplete = (moduleId: string, pointsAwarded: number) => {
    if (!completedModules.includes(moduleId)) {
      setCompletedModules(prev => [...prev, moduleId]);
      setModuleScores(prev => ({ ...prev, [moduleId]: pointsAwarded }));
      
      // Here you would call an API to save progress and award points
      console.log(`Module ${moduleId} completed! Awarded ${pointsAwarded} points.`);
    }
    
    // Move to the next module if available
    if (activeModuleIndex < course.modules.length - 1) {
      setActiveModuleIndex(prev => prev + 1);
    }
  };

  const handleTextModuleComplete = () => {
    handleModuleComplete(activeModule._id, 10); // Award 10 points for reading
  };

  const canAccessModule = (index: number) => {
    // First module is always accessible
    if (index === 0) return true;
    
    // Can access if previous module is completed
    const previousModule = course.modules[index - 1];
    return completedModules.includes(previousModule._id);
  };

  const getModuleIcon = (module: any, index: number) => {
    if (completedModules.includes(module._id)) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (!canAccessModule(index)) {
      return <Lock className="h-5 w-5 text-gray-400" />;
    }
    if (module.type === 'quiz') {
      return <HelpCircle className="h-5 w-5 text-blue-500" />;
    }
    return <BookOpen className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar with module list */}
        <aside className="w-full lg:w-80 bg-white border-r border-gray-200 shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/courses">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Courses
                </Link>
              </Button>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-sm text-gray-600 mb-4">{course.description}</p>
            
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{completedModules.length}/{course.modules.length} modules</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>
            </div>
          </div>

          <nav className="p-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {course.modules.map((module: any, index: number) => {
              const isActive = activeModuleIndex === index;
              const isCompleted = completedModules.includes(module._id);
              const canAccess = canAccessModule(index);
              const score = moduleScores[module._id];

              return (
                <button
                  key={module._id}
                  onClick={() => canAccess && setActiveModuleIndex(index)}
                  disabled={!canAccess}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    isActive 
                      ? 'bg-blue-100 border-2 border-blue-300 text-blue-900' 
                      : canAccess
                        ? 'hover:bg-gray-100 border border-gray-200'
                        : 'opacity-50 cursor-not-allowed border border-gray-100'
                  }`}
                >
                  {getModuleIcon(module, index)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {module.title || `Module ${index + 1}`}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {module.type}
                      </Badge>
                      {isCompleted && score && (
                        <Badge variant="secondary" className="text-xs">
                          {score} pts
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 p-6 lg:p-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">{activeModule.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {activeModule.type}
                    </Badge>
                    {completedModules.includes(activeModule._id) && (
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        ✓ Completed
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Module {activeModuleIndex + 1} of {course.modules.length}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Module Content */}
              {activeModule.type === 'text' && (
                <div>
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown>{activeModule.content || 'No content available.'}</ReactMarkdown>
                  </div>
                  
                  {!completedModules.includes(activeModule._id) && (
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-3">
                        Have you finished reading this module?
                      </p>
                      <Button onClick={handleTextModuleComplete} className="w-full sm:w-auto">
                        Mark as Complete
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeModule.type === 'quiz' && (
                <QuizPlayer
                  module={activeModule}
                  onComplete={(points) => handleModuleComplete(activeModule._id, points)}
                  isCompleted={completedModules.includes(activeModule._id)}
                  previousScore={moduleScores[activeModule._id]}
                />
              )}

              {/* Other module types */}
              {(activeModule.type === 'image' || activeModule.type === 'video') && (
                <div>
                  <div className="space-y-4">
                    {activeModule.type === 'image' && activeModule.content?.url && (
                      <img 
                        src={activeModule.content.url} 
                        alt={activeModule.title}
                        className="w-full rounded-lg shadow-md"
                      />
                    )}
                    {activeModule.type === 'video' && activeModule.content?.url && (
                      <div className="aspect-video">
                        <iframe
                          src={activeModule.content.url}
                          className="w-full h-full rounded-lg"
                          allowFullScreen
                        />
                      </div>
                    )}
                    {activeModule.content?.description && (
                      <div className="prose max-w-none">
                        <ReactMarkdown>{activeModule.content.description}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  {!completedModules.includes(activeModule._id) && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Button onClick={handleTextModuleComplete} className="w-full sm:w-auto">
                        Mark as Complete
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeModule.type === 'assignment' && (
                <div>
                  <div className="prose max-w-none">
                    <ReactMarkdown>{activeModule.content?.instructions || 'No instructions provided.'}</ReactMarkdown>
                  </div>
                  {activeModule.content?.dueDate && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Due Date:</strong> {new Date(activeModule.content.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {!completedModules.includes(activeModule._id) && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-3">
                        Have you completed this assignment?
                      </p>
                      <Button onClick={handleTextModuleComplete} className="w-full sm:w-auto">
                        Mark as Complete
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setActiveModuleIndex(prev => Math.max(0, prev - 1))}
                  disabled={activeModuleIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                
                <div className="text-sm text-gray-500">
                  {activeModuleIndex + 1} / {course.modules.length}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setActiveModuleIndex(prev => Math.min(course.modules.length - 1, prev + 1))}
                  disabled={activeModuleIndex === course.modules.length - 1 || !canAccessModule(activeModuleIndex + 1)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
