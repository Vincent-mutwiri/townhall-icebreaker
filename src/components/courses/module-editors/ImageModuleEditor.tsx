// src/components/courses/module-editors/ImageModuleEditor.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { MediaUploader } from '@/components/ui/media-uploader';
import Image from 'next/image';

interface ImageModuleEditorProps {
  module: {
    title: string;
    content: {
      url: string;
      description: string;
      altText?: string;
    };
  };
  onChange: (updates: any) => void;
}

export function ImageModuleEditor({ module, onChange }: ImageModuleEditorProps) {
  const handleImageUpload = (url: string) => {
    onChange({
      content: {
        ...module.content,
        url: url
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Image Module</CardTitle>
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

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Image</Label>
          <MediaUploader
            onUploadComplete={handleImageUpload}
            currentUrl={module.content.url}
            folder="courses/images"
            maxSizeMB={10}
            allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']}
            accept="image/*"
            buttonText={module.content.url ? 'Change Image' : 'Upload Image'}
            showPreview={true}
          />
          {module.content.url && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(module.content.url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Size
            </Button>
          )}
        </div>

        {/* Alt Text */}
        <div className="space-y-2">
          <Label htmlFor="altText">Alt Text (for accessibility)</Label>
          <Input
            id="altText"
            value={module.content.altText || ''}
            onChange={(e) => onChange({
              content: { ...module.content, altText: e.target.value }
            })}
            placeholder="Describe the image for screen readers..."
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
            placeholder="Add a description or caption for this image..."
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
