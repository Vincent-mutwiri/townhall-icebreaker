// src/app/api/upload/presigned-url/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generatePresignedUploadUrl, validateFile, getFileCategory } from '@/lib/s3-utils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // For now, allow unauthenticated uploads for public features like announcements
    // In production, you might want to restrict this based on your needs
    
    const { key, contentType, fileSize, requireAuth = false } = await request.json();
    
    if (requireAuth && !session?.user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    if (!key || !contentType) {
      return NextResponse.json({ 
        message: 'Key and content type are required' 
      }, { status: 400 });
    }

    // Validate file type and size
    const category = getFileCategory(contentType);
    if (category === 'unknown') {
      return NextResponse.json({ 
        message: 'File type not supported' 
      }, { status: 400 });
    }

    // Create a mock file object for validation
    const mockFile = { type: contentType, size: fileSize } as File;
    const validation = validateFile(mockFile);
    
    if (!validation.valid) {
      return NextResponse.json({ 
        message: validation.error 
      }, { status: 400 });
    }

    // Check environment variables
    const requiredEnvVars = {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_S3_REGION: process.env.AWS_S3_REGION,
      AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME
    };
    
    for (const [envKey, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        console.error(`Missing environment variable: ${envKey}`);
        return NextResponse.json({ 
          message: `AWS configuration incomplete: ${envKey}` 
        }, { status: 500 });
      }
    }

    // Generate presigned URL (expires in 5 minutes)
    const uploadUrl = await generatePresignedUploadUrl(key, contentType, 300);
    
    // Generate the public URL for the uploaded file
    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
    
    return NextResponse.json({ 
      uploadUrl, 
      key,
      publicUrl,
      category
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ 
      message: 'Failed to generate upload URL' 
    }, { status: 500 });
  }
}
