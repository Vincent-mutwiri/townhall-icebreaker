'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFileToS3, validateFile } from '@/lib/s3-utils';

interface UploadButtonProps {
  onUploadComplete?: (result: { url: string; key: string }) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  prefix?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  children?: React.ReactNode;
  maxFileSize?: number; // in bytes
  showToast?: boolean; // Control whether to show toast notifications
}

export function UploadButton({
  onUploadComplete,
  onUploadError,
  acceptedTypes,
  prefix = 'uploads',
  className = '',
  disabled = false,
  variant = 'default',
  size = 'default',
  children,
  maxFileSize,
  showToast = true
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset status
    setUploadStatus('uploading');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Check custom max file size if provided
      if (maxFileSize && file.size > maxFileSize) {
        throw new Error(`File size exceeds ${Math.round(maxFileSize / (1024 * 1024))}MB limit`);
      }

      // Upload file
      const result = await uploadFileToS3(
        file,
        prefix,
        undefined,
        (progress) => setUploadProgress(progress)
      );

      if (result.success && result.url && result.key) {
        setUploadStatus('success');
        onUploadComplete?.({ url: result.url, key: result.key });
        if (showToast) {
          toast.success('File uploaded successfully!');
        }

        // Reset after 2 seconds
        setTimeout(() => {
          setUploadStatus('idle');
          setUploadProgress(0);
        }, 2000);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadStatus('error');
      onUploadError?.(errorMessage);
      if (showToast) {
        toast.error(errorMessage);
      }
      
      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 3000);
    } finally {
      setIsUploading(false);
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getButtonContent = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading... {uploadProgress}%
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Uploaded!
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Failed
          </>
        );
      default:
        return children || (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (uploadStatus) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return variant;
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        variant={getButtonVariant()}
        size={size}
        disabled={disabled || isUploading}
        onClick={() => fileInputRef.current?.click()}
        className="relative overflow-hidden"
      >
        {getButtonContent()}
      </Button>
      
      {/* Progress bar */}
      {uploadStatus === 'uploading' && uploadProgress > 0 && (
        <Progress value={uploadProgress} className="h-2" />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes?.join(',') || '*/*'}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}

// Specialized upload buttons for common use cases
export function ImageUploadButton(props: Omit<UploadButtonProps, 'acceptedTypes'>) {
  return (
    <UploadButton
      {...props}
      acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']}
    >
      <Upload className="h-4 w-4 mr-2" />
      Upload Image
    </UploadButton>
  );
}

export function VideoUploadButton(props: Omit<UploadButtonProps, 'acceptedTypes'>) {
  return (
    <UploadButton
      {...props}
      acceptedTypes={['video/mp4', 'video/webm', 'video/mov']}
    >
      <Upload className="h-4 w-4 mr-2" />
      Upload Video
    </UploadButton>
  );
}

export function AudioUploadButton(props: Omit<UploadButtonProps, 'acceptedTypes'>) {
  return (
    <UploadButton
      {...props}
      acceptedTypes={['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']}
    >
      <Upload className="h-4 w-4 mr-2" />
      Upload Audio
    </UploadButton>
  );
}

export function DocumentUploadButton(props: Omit<UploadButtonProps, 'acceptedTypes'>) {
  return (
    <UploadButton
      {...props}
      acceptedTypes={[
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]}
    >
      <Upload className="h-4 w-4 mr-2" />
      Upload Document
    </UploadButton>
  );
}
