// src/components/ui/media-uploader.tsx
"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useS3Upload } from '@/hooks/useS3Upload';
import { Upload, X, Image as ImageIcon, Video, FileText, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface MediaUploaderProps {
  onUploadComplete: (url: string) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
  currentUrl?: string;
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  accept?: string;
  className?: string;
  buttonText?: string;
  showPreview?: boolean;
}

export function MediaUploader({
  onUploadComplete,
  onUploadStart,
  onUploadError,
  currentUrl,
  folder = 'general',
  maxSizeMB = 10,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  accept = 'image/*',
  className = '',
  buttonText = 'Upload File',
  showPreview = true
}: MediaUploaderProps) {
  const { uploadFile, isUploading, uploadProgress } = useS3Upload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl || null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview for images
    if (file.type.startsWith('image/') && showPreview) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    onUploadStart?.();

    try {
      const uploadedUrl = await uploadFile(file, {
        folder,
        maxSizeMB,
        allowedTypes
      });

      if (uploadedUrl) {
        setPreviewUrl(uploadedUrl);
        onUploadComplete(uploadedUrl);
      } else {
        // Reset preview on failure
        setPreviewUrl(currentUrl || null);
        onUploadError?.('Upload failed');
      }
    } catch (error) {
      setPreviewUrl(currentUrl || null);
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed');
    }

    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onUploadComplete('');
  };

  const getFileIcon = (url: string) => {
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <ImageIcon className="h-4 w-4" />;
    }
    if (url.match(/\.(mp4|webm|mov)$/i)) {
      return <Video className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {buttonText}
            </>
          )}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        )}
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {previewUrl && showPreview && (
        <div className="relative max-w-md">
          {previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <Image
              src={previewUrl}
              alt="Preview"
              width={400}
              height={200}
              className="rounded-lg object-cover border max-h-48"
              onError={() => {
                console.error('Failed to load image preview');
                setPreviewUrl(null);
              }}
            />
          ) : (
            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted">
              {getFileIcon(previewUrl)}
              <span className="text-sm truncate">{previewUrl.split('/').pop()}</span>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        Max size: {maxSizeMB}MB. Supported: {allowedTypes.map(type => type.split('/')[1]).join(', ')}
      </div>
    </div>
  );
}