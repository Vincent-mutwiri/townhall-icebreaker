// src/components/courses/module-editors/VideoModuleEditor.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Loader2, Trash2, ExternalLink, Play, Link } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFileToS3 } from '@/lib/s3-utils';

interface VideoModuleEditorProps {
  module: {
    title: string;
    content: {
      url: string;
      description: string;
      type?: 'upload' | 'youtube' | 'vimeo' | 'external';
      thumbnail?: string;
      duration?: string;
    };
  };
  onChange: (updates: any) => void;
}

export function VideoModuleEditor({ module, onChange }: VideoModuleEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'upload' | 'external'>(
    module.content.type === 'upload' ? 'upload' : 'external'
  );

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid video file (MP4, WebM, OGG, AVI, or MOV)');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video size must be less than 100MB');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadFileToS3(file, 'courses/videos');
      
      if (result.success && result.url) {
        onChange({
          content: {
            ...module.content,
            url: result.url,
            type: 'upload'
          }
        });
        toast.success('Video uploaded successfully!');
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      toast.error(`Upload failed: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      // Clear the input so the same file can be selected again
      event.target.value = '';
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    // Convert YouTube URLs to embed format
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convert Vimeo URLs to embed format
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url;
  };

  const isVideoUrl = (url: string) => {
    return url.includes('youtube.com') || 
           url.includes('youtu.be') || 
           url.includes('vimeo.com') ||
           url.includes('.mp4') ||
           url.includes('.webm') ||
           url.includes('.ogg');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Video Module</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Module Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Module Title</Label>
          <Input
            id="title"
            value={module.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Enter module title..."
          />
        </div>

        {/* Video Upload/Link Tabs */}
        <div className="space-y-2">
          <Label>Video Source</Label>
          <Tabs value={uploadType} onValueChange={(value) => setUploadType(value as 'upload' | 'external')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Video</TabsTrigger>
              <TabsTrigger value="external">External Link</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              {module.content.url && module.content.type === 'upload' && (
                <div className="space-y-2">
                  <div className="relative w-full max-w-md">
                    <video
                      controls
                      className="w-full h-48 rounded-lg border object-cover"
                      src={module.content.url}
                    >
                      Your browser does not support the video tag.
                    </video>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => onChange({
                        content: { ...module.content, url: '', type: undefined }
                      })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <input
                  ref={(input) => {
                    if (input) {
                      (window as any).videoModuleUploadInput = input;
                    }
                  }}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/avi,video/mov"
                  onChange={handleVideoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={() => {
                    const input = (window as any).videoModuleUploadInput;
                    if (input) input.click();
                  }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {module.content.url && module.content.type === 'upload' ? 'Change Video' : 'Upload Video'}
                    </>
                  )}
                </Button>
                {module.content.url && module.content.type === 'upload' && (
                  <span className="text-sm text-muted-foreground">
                    Video uploaded
                  </span>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="external" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={uploadType === 'external' ? module.content.url : ''}
                  onChange={(e) => onChange({
                    content: {
                      ...module.content,
                      url: e.target.value,
                      type: 'external'
                    }
                  })}
                  placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                />
                <p className="text-sm text-muted-foreground">
                  Supports YouTube, Vimeo, and direct video file URLs
                </p>
              </div>
              
              {module.content.url && uploadType === 'external' && isVideoUrl(module.content.url) && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="relative w-full max-w-md">
                    <iframe
                      src={getVideoEmbedUrl(module.content.url)}
                      className="w-full h-48 rounded-lg border"
                      allowFullScreen
                      title={module.title}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (optional)</Label>
          <Input
            id="duration"
            value={module.content.duration || ''}
            onChange={(e) => onChange({
              content: { ...module.content, duration: e.target.value }
            })}
            placeholder="e.g., 5:30 or 5 minutes"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={module.content.description}
            onChange={(e) => onChange({
              content: { ...module.content, description: e.target.value }
            })}
            placeholder="Add a description for this video..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
