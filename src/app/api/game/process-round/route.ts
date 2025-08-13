import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';
import { gameController } from '@/lib/gameController';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { pin } = await request.json();

    // Trigger server-controlled processing
    await gameController.processRound(pin);

    return NextResponse.json({ message: 'Round processed by server' });

  } catch (error) {
    console.error('Error processing round:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}