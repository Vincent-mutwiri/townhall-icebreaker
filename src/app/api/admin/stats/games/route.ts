import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';

export async function GET() {
  try {
    await connectToDatabase();
    const count = await Game.countDocuments();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return NextResponse.json({ count: 0 });
  }
}