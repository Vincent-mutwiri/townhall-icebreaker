import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function GET() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Prefix: 'uploads/',
    });

    const response = await s3Client.send(command);
    
    const files = response.Contents?.map(object => ({
      key: object.Key,
      size: object.Size,
      lastModified: object.LastModified,
      url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${object.Key}`,
      type: getFileType(object.Key || ''),
    })) || [];

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error listing S3 objects:', error);
    return NextResponse.json({ message: 'Failed to fetch media files.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json({ message: 'File key is required.' }, { status: 400 });
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: key,
    });

    await s3Client.send(command);
    
    return NextResponse.json({ message: 'File deleted successfully.' });
  } catch (error) {
    console.error('Error deleting S3 object:', error);
    return NextResponse.json({ message: 'Failed to delete file.' }, { status: 500 });
  }
}

function getFileType(key: string): 'image' | 'video' | 'audio' | 'unknown' {
  const extension = key.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'image';
  if (['mp4', 'webm', 'mov'].includes(extension || '')) return 'video';
  if (['mp3', 'wav', 'ogg'].includes(extension || '')) return 'audio';
  
  return 'unknown';
}