import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    console.log('Testing AWS connection...');
    
    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    console.log('AWS connection successful, buckets:', response.Buckets?.map(b => b.Name));
    
    return NextResponse.json({ 
      success: true,
      message: 'AWS connection successful',
      buckets: response.Buckets?.map(b => b.Name) || []
    });
  } catch (error) {
    console.error('AWS connection test failed:', error);
    return NextResponse.json({ 
      success: false,
      message: 'AWS connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}