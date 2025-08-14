import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Question } from '@/models/Question';

export async function GET() {
  try {
    await connectToDatabase();
    const total = await Question.countDocuments();
    const global = await Question.countDocuments({ isGlobal: true });
    return NextResponse.json({ total, global });
  } catch (error) {
    console.error('Error fetching question stats:', error);
    return NextResponse.json({ total: 0, global: 0 });
  }
}