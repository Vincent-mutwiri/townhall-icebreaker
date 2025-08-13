// src/app/api/game/join/route.ts
import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { pin, name } = body;

    // 1. Validate input
    if (!pin || !name) {
      return NextResponse.json({ message: 'Game PIN and name are required.' }, { status: 400 });
    }
    if (name.length < 2 || name.length > 20) {
      return NextResponse.json({ message: 'Name must be between 2 and 20 characters.' }, { status: 400 });
    }

    // 2. Find the game
    const game = await Game.findOne({ pin: pin.toUpperCase() });

    if (!game) {
      return NextResponse.json({ message: 'Game not found. Please check the PIN.' }, { status: 404 });
    }

    // 3. Check for a host
    if (!game.host) {
      return NextResponse.json({ message: 'This game is invalid and cannot be joined because it has no host.' }, { status: 400 });
    }

    // 4. Check game status
    if (game.status !== 'lobby') {
      return NextResponse.json({ message: 'This game has already started.' }, { status: 403 });
    }

    // 4. Create a new player
    const newPlayer = new Player({
      name: name,
      game: game._id, // Link player to the game
    });
    await newPlayer.save();

    // 5. Add the player to the game's player list
    game.players.push(newPlayer._id);
    await game.save();

    return NextResponse.json({
      message: 'Successfully joined the game!',
      pin: game.pin,
      playerId: newPlayer._id,
    }, { status: 200 });

  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}