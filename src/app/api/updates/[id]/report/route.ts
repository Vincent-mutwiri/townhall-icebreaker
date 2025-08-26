// src/app/api/updates/[id]/report/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/database';
import { ReportedContent } from '@/models/ReportedContent';
import { UpdatePost } from '@/models/UpdatePost';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const { reason, description } = await request.json();
    const reporterId = (session.user as any).id;

    // Validate reason
    const validReasons = ['spam', 'harassment', 'inappropriate_content', 'misinformation', 'copyright_violation', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ message: 'Invalid report reason' }, { status: 400 });
    }

    // Check if the post exists
    const post = await UpdatePost.findById(id);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // Check if user has already reported this content
    const existingReport = await ReportedContent.findOne({
      contentId: id,
      contentType: 'UpdatePost',
      reporterId: reporterId
    });

    if (existingReport) {
      return NextResponse.json({ message: 'You have already reported this content' }, { status: 400 });
    }

    // Create the report
    const report = await ReportedContent.create({
      contentId: id,
      contentType: 'UpdatePost',
      reporterId: reporterId,
      reason,
      description: description || '',
      status: 'pending'
    });

    return NextResponse.json({ 
      message: 'Content reported successfully. Our moderation team will review it.',
      reportId: report._id
    }, { status: 201 });

  } catch (error) {
    console.error('Error reporting content:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
