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
import { MediaUploader } from '@/components/ui/media-uploader';

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
  const [uploadType, setUploadType] = useState<'upload' | 'external'>(
    module.content.type === 'upload' ? 'upload' : 'external'
  );

  const handleVideoUpload = (url: string) => {
    onChange({
      content: {
        ...module.content,
        url: url,
        type: 'upload'
      }
    });
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
              <MediaUploader
                onUploadComplete={handleVideoUpload}
                currentUrl={module.content.type === 'upload' ? module.content.url : ''}
                folder="courses/videos"
                maxSizeMB={100}
                allowedTypes={['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']}
                accept="video/*"
                buttonText={module.content.url && module.content.type === 'upload' ? 'Change Video' : 'Upload Video'}
                showPreview={false}
              />
              
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
                  </div>
                </div>
              )}
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
