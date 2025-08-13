// src/app/api/game/create/route.ts
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';

// We'll use a simple in-memory store for now to generate unique pins.
// In a larger application, you might check the DB to ensure uniqueness.
const generatedPins = new Set();

function generateUniquePin(): string {
  let pin: string;
  do {
    // Generate a 6-character, uppercase, alphanumeric pin. Easy to type!
    pin = randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
  } while (generatedPins.has(pin));
  generatedPins.add(pin);
  return pin;
}

export async function POST(request: Request) {
  try {
    // 1. Connect to the database
    await connectToDatabase();

    // 2. Parse the request body
    const body = await request.json();
    const { hostName, initialPrize, incrementAmount, hostSocketId } = body;

    // 3. Validate the input
    if (!hostName || !initialPrize || !incrementAmount || initialPrize <= 0 || incrementAmount <= 0) {
      return NextResponse.json(
        { message: 'Invalid input. Name is required and prize/increment must be positive numbers.' },
        { status: 400 }
      );
    }

    // 4. Use fallback host ID if socket ID is not available
    const finalHostId = hostSocketId || 'temp-host-' + Date.now();

    // 5. Generate a unique game pin
    const gamePin = generateUniquePin();

    // 6. Create a new game document
    const newGame = new Game({
      pin: gamePin,
      host: finalHostId,
      hostName: hostName,
      initialPrize: initialPrize,
      incrementAmount: incrementAmount,
      prizePool: initialPrize, // The prize pool starts at the initial amount
      status: 'lobby',
      players: [], // No players have joined yet
      questions: [], // No questions added yet
    });

    // 7. Save the game to the database
    await newGame.save();

    // 8. Return a success response with the game pin
    return NextResponse.json({
      message: 'Game created successfully!',
      pin: newGame.pin,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json(
      { message: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}