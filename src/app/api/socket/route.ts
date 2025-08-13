import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Socket endpoint' });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ message: 'Socket endpoint' });
}