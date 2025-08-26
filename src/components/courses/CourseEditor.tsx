// src/components/courses/CourseEditor.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast, Toaster } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, Save, Plus, FileText, HelpCircle, Image, Video, ClipboardList, Trash2 } from "lucide-react";
import Link from "next/link";
import { TextModuleEditor } from "./module-editors/TextModuleEditor";
import { QuizModuleEditor } from "./module-editors/QuizModuleEditor";

// Define a type for our course state
type CourseState = {
  _id?: string;
  title: string;
  description: string;
  modules: any[];
  status: 'draft' | 'published';
};

export function CourseEditor({ initialCourse }: { initialCourse: CourseState | null }) {
  const router = useRouter();
  const [course, setCourse] = useState<CourseState>(
    initialCourse || { title: '', description: '', modules: [], status: 'draft' }
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCourse = async () => {
    if (!course.title.trim() || !course.description.trim()) {
      toast.error("Please fill in both title and description");
      return;
    }

    setIsSaving(true);
    const url = course._id ? `/api/courses/${course._id}` : '/api/courses';
    const method = course._id ? 'PATCH' : 'POST';

    // Clean up the course data before sending
    const courseToSave = {
      ...course,
      modules: course.modules.map(module => {
        const cleanModule = { ...module };
        // Remove temporary IDs
        if (cleanModule.tempId) {
          delete cleanModule.tempId;
        }
        return cleanModule;
      })
    };

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseToSave),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Failed to save.");

      toast.success("Course saved successfully!");
      if (!course._id) {
        // If it was a new course, redirect to its new edit page
        router.push(`/courses/manage/${data._id}/edit`);
      } else {
        // Update the local state with the saved data (including proper MongoDB IDs)
        setCourse(data);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addModule = (type: 'text' | 'quiz' | 'image' | 'video' | 'assignment') => {
    const newModule = {
      tempId: `temp_${Date.now()}_${Math.random()}`, // Temporary ID for React key - will be removed on save
      type,
      title: `New ${type} module`,
      content: type === 'quiz' ? { questions: [] } : type === 'text' ? '' : { url: '', description: '' },
    };
    setCourse(prev => ({ ...prev, modules: [...prev.modules, newModule] }));
  };

  const updateModule = (index: number, updates: any) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.map((module, i) => 
        i === index ? { ...module, ...updates } : module
      )
    }));
  };

  const removeModule = (index: number) => {
    setCourse(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index)
    }));
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'quiz': return <HelpCircle className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'assignment': return <ClipboardList className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Toaster richColors />
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href="/courses/manage">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {course._id ? "Edit Course" : "Create New Course"}
            </h1>
          </div>
          <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
            {course.status}
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Details */}
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter course title..."
                    value={course.title} 
                    onChange={e => setCourse(p => ({ ...p, title: e.target.value }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe what students will learn in this course..."
                    value={course.description} 
                    onChange={e => setCourse(p => ({ ...p, description: e.target.value }))} 
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={course.status} 
                    onValueChange={(value: 'draft' | 'published') => 
                      setCourse(p => ({ ...p, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Modules Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Course Modules ({course.modules.length})
                  <div className="flex gap-2">
                    <Select onValueChange={(value) => addModule(value as any)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Add Module" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Text Content
                          </div>
                        </SelectItem>
                        <SelectItem value="quiz">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Quiz
                          </div>
                        </SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Image
                          </div>
                        </SelectItem>
                        <SelectItem value="video">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Video
                          </div>
                        </SelectItem>
                        <SelectItem value="assignment">
                          <div className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            Assignment
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {course.modules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="mx-auto h-8 w-8 mb-2" />
                    <p>No modules yet. Add your first module above.</p>
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full">
                    {course.modules.map((module, index) => (
                      <AccordionItem key={module._id || module.tempId || index} value={`item-${index}`}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left">
                            {getModuleIcon(module.type)}
                            <div>
                              <div className="font-medium">
                                {module.title || `Module ${index + 1}`}
                              </div>
                              <div className="text-sm text-muted-foreground capitalize">
                                {module.type}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Module Title</Label>
                              <Input
                                value={module.title}
                                onChange={(e) => updateModule(index, { title: e.target.value })}
                                placeholder="Enter module title..."
                              />
                            </div>
                            
                            {/* Module-specific content editor */}
                            {module.type === 'text' && (
                              <TextModuleEditor
                                content={module.content}
                                onContentChange={(newContent) => updateModule(index, { content: newContent })}
                              />
                            )}

                            {module.type === 'quiz' && (
                              <QuizModuleEditor
                                content={module.content || { questions: [] }}
                                onContentChange={(newContent) => updateModule(index, { content: newContent })}
                              />
                            )}

                            {(module.type === 'image' || module.type === 'video') && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>URL</Label>
                                  <Input
                                    value={module.content?.url || ''}
                                    onChange={(e) => updateModule(index, {
                                      content: { ...module.content, url: e.target.value }
                                    })}
                                    placeholder={`Enter ${module.type} URL...`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Description</Label>
                                  <Textarea
                                    value={module.content?.description || ''}
                                    onChange={(e) => updateModule(index, {
                                      content: { ...module.content, description: e.target.value }
                                    })}
                                    placeholder="Describe this content..."
                                    rows={3}
                                  />
                                </div>
                              </div>
                            )}
                            
                            {module.type === 'assignment' && (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Instructions</Label>
                                  <Textarea
                                    value={module.content?.instructions || ''}
                                    onChange={(e) => updateModule(index, { 
                                      content: { ...module.content, instructions: e.target.value }
                                    })}
                                    placeholder="Enter assignment instructions..."
                                    rows={4}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Due Date</Label>
                                  <Input
                                    type="date"
                                    value={module.content?.dueDate || ''}
                                    onChange={(e) => updateModule(index, { 
                                      content: { ...module.content, dueDate: e.target.value }
                                    })}
                                  />
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-end pt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => removeModule(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Module
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSaveCourse} 
                  disabled={isSaving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Course"}
                </Button>
                
                {course.status === 'draft' && course._id && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setCourse(p => ({ ...p, status: 'published' }))}
                  >
                    Publish Course
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Modules:</span>
                  <span>{course.modules.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                    {course.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
