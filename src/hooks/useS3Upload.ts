// src/hooks/useS3Upload.ts
import { useState } from 'react';
import { toast } from 'sonner';

interface UploadOptions {
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function useS3Upload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File, options: UploadOptions = {}): Promise<string | null> => {
    const {
      folder = 'general',
      maxSizeMB = 10,
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
    } = options;

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast.error(`File type not allowed. Supported types: ${allowedTypes.join(', ')}`);
      return null;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`File size must be less than ${maxSizeMB}MB. Current size: ${fileSizeMB.toFixed(2)}MB`);
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get a presigned URL from our API
      const presignedResponse = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileType: file.type,
          fileName: file.name,
          folder: folder
        }),
      });

      if (!presignedResponse.ok) {
        const error = await presignedResponse.json();
        throw new Error(error.message || "Failed to get upload URL.");
      }

      const { uploadUrl, key, fileUrl } = await presignedResponse.json();

      // 2. Upload the file directly to S3 with progress tracking
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed with status: ${uploadResponse.status}`);
      }

      setUploadProgress(100);
      toast.success("File uploaded successfully!");
      
      // Return the final URL (either from API response or construct it)
      return fileUrl || constructS3Url(key);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Upload failed.");
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const constructS3Url = (key: string): string => {
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
    const region = process.env.NEXT_PUBLIC_AWS_S3_REGION;
    
    if (!bucketName || !region) {
      throw new Error('S3 configuration missing');
    }
    
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  };

  return { 
    uploadFile, 
    isUploading, 
    uploadProgress 
  };
}