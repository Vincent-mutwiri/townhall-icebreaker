import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    console.log('Upload URL request received');
    
    const { fileType, fileName } = await request.json();
    console.log('Request data:', { fileType, fileName });
    
    if (!fileType) {
      return NextResponse.json({ message: 'File type is required.' }, { status: 400 });
    }

    // Check environment variables
    const requiredEnvVars = {
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_S3_REGION: process.env.AWS_S3_REGION,
      AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME
    };
    
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        console.error(`Missing environment variable: ${key}`);
        return NextResponse.json({ message: `Missing AWS configuration: ${key}` }, { status: 500 });
      }
    }
    
    console.log('Environment variables check passed');

    // Generate a unique key for the file
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const extension = fileName ? fileName.split('.').pop() : fileType.split('/')[1];
    const key = `uploads/${timestamp}-${randomId}.${extension}`;
    
    console.log('Generated key:', key);
    
    // Create the command for putting an object
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    console.log('Creating presigned URL...');
    
    // Generate presigned URL (expires in 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    
    console.log('Presigned URL generated successfully');
    
    // Generate the public URL for the uploaded file
    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`;
    
    console.log('Public URL:', publicUrl);
    
    return NextResponse.json({ 
      uploadUrl, 
      key,
      publicUrl
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json({ 
      message: 'Failed to generate upload URL.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}