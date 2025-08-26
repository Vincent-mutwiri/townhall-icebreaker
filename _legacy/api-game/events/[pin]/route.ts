import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ type: 'NO_UPDATE' });
}