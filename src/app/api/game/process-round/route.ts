import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';
import { gameController } from '@/lib/gameController';

export async function POST(request: Request) {
  // This API is no longer needed since gameController handles timing
  return NextResponse.json({ message: 'Round processing handled by WebSocket server' });
}