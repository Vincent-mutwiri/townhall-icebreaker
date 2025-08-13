import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Socket endpoint' });
}

export async function POST() {
  return NextResponse.json({ message: 'Socket endpoint' });
}