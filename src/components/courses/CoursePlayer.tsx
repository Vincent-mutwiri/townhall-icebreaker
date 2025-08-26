// src/components/courses/CoursePlayer.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Lock, PlayCircle, BookOpen, HelpCircle, ArrowLeft, ArrowRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { QuizPlayer } from "./QuizPlayer";
import Link from "next/link";
import { toast } from "sonner";

export function CoursePlayer({ course, userId }: { course: any, userId: string }) {
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeModule = course.modules[activeModuleIndex];
  const completedCount = course.modules.filter((m: any) => m.isCompleted).length;
  const progress = (completedCount / course.modules.length) * 100;

  const handleModuleComplete = async (moduleId: string, score?: number) => {
    // Prevent re-completing a module
    if (activeModule.isCompleted || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/progress/complete-module', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course._id,
          moduleId,
          score: score || 0
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save progress.");
      }

      // Show success notification
      if (data.courseCompleted) {
        toast.success(`🎉 Course Complete! +${data.pointsAwarded} points!`, {
          description: "Congratulations on finishing the entire course!"
        });
      } else {
        toast.success(`✅ Module Complete! +${data.pointsAwarded} points!`);
      }

      // Mark the current module as completed in the local state
      course.modules[activeModuleIndex].isCompleted = true;

      // Unlock the next module if it exists and was locked
      if (activeModuleIndex < course.modules.length - 1) {
        const nextModule = course.modules[activeModuleIndex + 1];
        if (nextModule.isLocked) {
          // Simple unlock logic - in a real app, you'd re-fetch from server
          nextModule.isLocked = false;
        }
        setActiveModuleIndex(prev => prev + 1);
      } else if (data.courseCompleted) {
        toast.info("🎓 You've completed the entire course! Well done!");
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to save progress");
      console.error('Progress save error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextModuleComplete = () => {
    handleModuleComplete(activeModule._id);
  };

  const getModuleIcon = (module: any) => {
    if (module.isCompleted) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (module.isLocked) {
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
                <span>{completedCount}/{course.modules.length} modules</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>
              {course.userProgress && (
                <p className="text-xs text-blue-600">
                  Your points: {course.userProgress.userPoints}
                </p>
              )}
            </div>
          </div>

          <nav className="p-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {course.modules.map((module: any, index: number) => {
              const isActive = activeModuleIndex === index;

              return (
                <button
                  key={module._id}
                  onClick={() => !module.isLocked && setActiveModuleIndex(index)}
                  disabled={module.isLocked}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                    isActive
                      ? 'bg-blue-100 border-2 border-blue-300 text-blue-900'
                      : !module.isLocked
                        ? 'hover:bg-gray-100 border border-gray-200'
                        : 'opacity-50 cursor-not-allowed border border-gray-100'
                  }`}
                >
                  {getModuleIcon(module)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {module.title || `Module ${index + 1}`}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {module.type}
                      </Badge>
                      {module.isCompleted && (
                        <Badge variant="secondary" className="text-xs text-green-700 bg-green-100">
                          ✓ Done
                        </Badge>
                      )}
                      {module.isLocked && module.lockRules?.minPoints && (
                        <Badge variant="outline" className="text-xs text-amber-700">
                          {module.lockRules.minPoints} pts needed
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
                    {activeModule.isCompleted && (
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

                  {!activeModule.isCompleted && (
                    <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-3">
                        Have you finished reading this module?
                      </p>
                      <Button
                        onClick={handleTextModuleComplete}
                        className="w-full sm:w-auto"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Mark as Complete"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeModule.type === 'quiz' && (
                <QuizPlayer
                  module={activeModule}
                  onComplete={(score) => handleModuleComplete(activeModule._id, score)}
                  isCompleted={activeModule.isCompleted}
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

                  {!activeModule.isCompleted && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Button
                        onClick={handleTextModuleComplete}
                        className="w-full sm:w-auto"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Mark as Complete"}
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

                  {!activeModule.isCompleted && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-3">
                        Have you completed this assignment?
                      </p>
                      <Button
                        onClick={handleTextModuleComplete}
                        className="w-full sm:w-auto"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Mark as Complete"}
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
                  disabled={
                    activeModuleIndex === course.modules.length - 1 ||
                    (activeModuleIndex < course.modules.length - 1 && course.modules[activeModuleIndex + 1].isLocked)
                  }
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
