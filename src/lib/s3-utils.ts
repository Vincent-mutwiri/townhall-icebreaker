// src/lib/s3-utils.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Server-side S3 client
export const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// File type validation
export const ALLOWED_FILE_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  document: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  audio: 50 * 1024 * 1024, // 50MB
  document: 25 * 1024 * 1024 // 25MB
};

// Utility functions
export function getFileCategory(mimeType: string): keyof typeof ALLOWED_FILE_TYPES | 'unknown' {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimeType)) {
      return category as keyof typeof ALLOWED_FILE_TYPES;
    }
  }
  return 'unknown';
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const category = getFileCategory(file.type);
  
  if (category === 'unknown') {
    return { valid: false, error: 'File type not supported' };
  }
  
  const maxSize = MAX_FILE_SIZES[category];
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit` 
    };
  }
  
  return { valid: true };
}

export function generateS3Key(prefix: string, fileName: string, userId?: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const userPrefix = userId ? `${userId}/` : '';
  
  return `${prefix}/${userPrefix}${timestamp}-${randomId}.${extension}`;
}

export function getPublicUrl(key: string): string {
  const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
  const region = process.env.NEXT_PUBLIC_AWS_S3_REGION || process.env.AWS_S3_REGION;
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
}

// Server-side functions
export async function generatePresignedUploadUrl(
  key: string, 
  contentType: string, 
  expiresIn: number = 300
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteS3Object(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });

  await s3Client.send(command);
}

export async function generatePresignedDownloadUrl(
  key: string, 
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

// Client-side upload function
export async function uploadFileToS3(
  file: File, 
  prefix: string = 'uploads',
  userId?: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    onProgress?.(10);

    // Generate key
    const key = generateS3Key(prefix, file.name, userId);

    // Get presigned URL
    const response = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        contentType: file.type,
        fileSize: file.size
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message || 'Failed to get upload URL' };
    }

    const { uploadUrl } = await response.json();
    onProgress?.(30);

    // Upload to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      return { success: false, error: 'Failed to upload file to S3' };
    }

    onProgress?.(100);

    const publicUrl = getPublicUrl(key);
    return { success: true, url: publicUrl, key };

  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Upload failed' 
    };
  }
}

// Helper function to extract S3 key from URL
export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const bucketName = process.env.NEXT_PUBLIC_AWS_S3_BUCKET_NAME;
    const region = process.env.NEXT_PUBLIC_AWS_S3_REGION;
    
    if (!bucketName || !region) return null;
    
    const patterns = [
      new RegExp(`https://${bucketName}\\.s3\\.${region}\\.amazonaws\\.com/(.+)`),
      new RegExp(`https://s3\\.${region}\\.amazonaws\\.com/${bucketName}/(.+)`),
      new RegExp(`https://${bucketName}\\.s3\\.amazonaws\\.com/(.+)`)
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return decodeURIComponent(match[1]);
    }
    
    return null;
  } catch {
    return null;
  }
}
