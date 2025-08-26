'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadFileToS3, getFileCategory, validateFile } from '@/lib/s3-utils';

interface MediaUploaderProps {
  onUploadComplete?: (result: { url: string; key: string; category: string }) => void;
  onUploadError?: (error: string) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  prefix?: string;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  requireAuth?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  url?: string;
  key?: string;
  error?: string;
  id: string;
}

export function MediaUploader({
  onUploadComplete,
  onUploadError,
  acceptedTypes,
  maxFiles = 5,
  prefix = 'uploads',
  className = '',
  disabled = false,
  showPreview = true,
  requireAuth = false
}: MediaUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (file: File) => {
    const category = getFileCategory(file.type);
    switch (category) {
      case 'image': return <ImageIcon className="h-5 w-5" />;
      case 'video': return <Video className="h-5 w-5" />;
      case 'audio': return <Music className="h-5 w-5" />;
      case 'document': return <FileText className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFiles = useCallback(async (files: FileList) => {
    if (disabled) return;

    const fileArray = Array.from(files);
    
    // Check max files limit
    if (uploadingFiles.length + fileArray.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Filter accepted types if specified
    const validFiles = acceptedTypes 
      ? fileArray.filter(file => acceptedTypes.includes(file.type))
      : fileArray;

    if (validFiles.length !== fileArray.length) {
      toast.error('Some files were rejected due to unsupported file types');
    }

    // Create uploading file objects
    const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
      id: Math.random().toString(36).substring(2)
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload each file
    for (const uploadingFile of newUploadingFiles) {
      try {
        const result = await uploadFileToS3(
          uploadingFile.file,
          prefix,
          undefined, // userId - can be added if needed
          (progress) => {
            setUploadingFiles(prev => 
              prev.map(f => 
                f.id === uploadingFile.id 
                  ? { ...f, progress }
                  : f
              )
            );
          }
        );

        if (result.success && result.url && result.key) {
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === uploadingFile.id 
                ? { 
                    ...f, 
                    status: 'completed' as const, 
                    url: result.url,
                    key: result.key,
                    progress: 100
                  }
                : f
            )
          );

          const category = getFileCategory(uploadingFile.file.type);
          onUploadComplete?.({ 
            url: result.url, 
            key: result.key, 
            category 
          });

          toast.success(`${uploadingFile.file.name} uploaded successfully`);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setUploadingFiles(prev => 
          prev.map(f => 
            f.id === uploadingFile.id 
              ? { 
                  ...f, 
                  status: 'error' as const, 
                  error: errorMessage
                }
              : f
          )
        );

        onUploadError?.(errorMessage);
        toast.error(`Failed to upload ${uploadingFile.file.name}: ${errorMessage}`);
      }
    }
  }, [disabled, uploadingFiles.length, maxFiles, acceptedTypes, prefix, onUploadComplete, onUploadError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setUploadingFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors ${
          dragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">
            {dragActive ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Maximum {maxFiles} files • Images, videos, audio, documents
          </p>
          <Button variant="outline" disabled={disabled} type="button">
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes?.join(',') || '*/*'}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Uploading Files</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearCompleted}
                disabled={!uploadingFiles.some(f => f.status === 'completed')}
              >
                Clear Completed
              </Button>
            </div>
            
            <div className="space-y-3">
              {uploadingFiles.map((uploadingFile) => (
                <div key={uploadingFile.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {getFileIcon(uploadingFile.file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {uploadingFile.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(uploadingFile.file.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {uploadingFile.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {uploadingFile.status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {uploadingFile.status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(uploadingFile.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {uploadingFile.status === 'uploading' && (
                    <Progress value={uploadingFile.progress} className="h-2" />
                  )}
                  
                  {uploadingFile.status === 'error' && uploadingFile.error && (
                    <p className="text-xs text-red-500">{uploadingFile.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
