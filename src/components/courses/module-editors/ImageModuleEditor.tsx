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
import { uploadFileToS3 } from '@/lib/s3-utils';
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
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadFileToS3(file, 'courses/images');
      
      if (result.success && result.url) {
        onChange({
          content: {
            ...module.content,
            url: result.url
          }
        });
        toast.success('Image uploaded successfully!');
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
          <div className="space-y-4">
            {module.content.url && (
              <div className="relative w-full max-w-md">
                <div className="relative h-48 rounded-lg overflow-hidden border">
                  <Image
                    src={module.content.url}
                    alt={module.content.altText || module.title}
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => onChange({
                      content: { ...module.content, url: '' }
                    })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(module.content.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Size
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <input
                ref={(input) => {
                  if (input) {
                    (window as any).imageModuleUploadInput = input;
                  }
                }}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => {
                  const input = (window as any).imageModuleUploadInput;
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
                    {module.content.url ? 'Change Image' : 'Upload Image'}
                  </>
                )}
              </Button>
              {module.content.url && (
                <span className="text-sm text-muted-foreground">
                  Image uploaded
                </span>
              )}
            </div>
          </div>
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
