// src/app/api/upload/presigned-url/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { generatePresignedUploadUrl, validateFile, getFileCategory } from '@/lib/s3-utils';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    const { fileType, fileName, folder = 'general', requireAuth = false } = await request.json();
    
    if (requireAuth && !session?.user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    if (!fileType) {
      return NextResponse.json({ 
        message: 'File type is required' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'application/pdf', 'text/plain'
    ];
    
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json({ 
        message: 'File type not supported' 
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

    // Generate unique key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = fileName ? fileName.split('.').pop() : fileType.split('/')[1];
    const key = `${folder}/${timestamp}-${randomString}.${fileExtension}`;

    // Generate presigned URL (expires in 5 minutes)
    const uploadUrl = await generatePresignedUploadUrl(key, fileType, 300);
    
    // Generate the public URL for the uploaded file
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
    
    return NextResponse.json({ 
      uploadUrl, 
      key,
      fileUrl
    });

  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json({ 
      message: 'Failed to generate upload URL' 
    }, { status: 500 });
  }
}
