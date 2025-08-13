import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';

export async function GET(request: Request, { params }: { params: { pin: string } }) {
  try {
    await connectToDatabase();
    const { pin } = params;

    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    return NextResponse.json(JSON.parse(JSON.stringify(game)));

  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}