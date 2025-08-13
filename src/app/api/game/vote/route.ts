import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { pin, votedForPlayerId } = await request.json();

    if (!pin || !votedForPlayerId) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    // For now, just return success - vote processing will be handled by timer
    return NextResponse.json({ message: 'Vote submitted.' });

  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}