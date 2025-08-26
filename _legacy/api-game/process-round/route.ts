import { NextResponse } from 'next/server';
export async function POST() {
  // This API is no longer needed since gameController handles timing
  return NextResponse.json({ message: 'Round processing handled by WebSocket server' });
}