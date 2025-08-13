import { NextResponse } from 'next/server';
import { gameController } from '@/lib/gameController';

export async function GET(request: Request, context: { params: Promise<{ pin: string }> }) {
  try {
    const { pin } = await context.params;
    const gameState = gameController.getGameState(pin);
    
    return NextResponse.json(gameState || { type: 'NO_UPDATE' });
  } catch (error) {
    console.error('Error getting game events:', error);
    return NextResponse.json({ type: 'ERROR' }, { status: 500 });
  }
}