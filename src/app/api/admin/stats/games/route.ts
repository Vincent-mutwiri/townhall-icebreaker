import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { HostedGame } from '@/models/HostedGame';

export async function GET() {
  try {
    await connectToDatabase();
    const count = await HostedGame.countDocuments();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching game stats:', error);
    return NextResponse.json({ count: 0 });
  }
}