// src/app/api/progress/[courseId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { Progress } from '@/models/Progress';

export async function GET(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    await connectToDatabase();
    const { courseId } = await params;

    const userProgress = await Progress.findOne({ userId, courseId });
    
    return NextResponse.json({
      completedModules: userProgress ? userProgress.completedModules : [],
      lastUpdated: userProgress ? userProgress.updatedAt : null
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
