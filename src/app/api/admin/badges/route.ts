// src/app/api/admin/badges/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { Badge } from '@/models/Badge';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const badgeData = await request.json();

    // Validation
    if (!badgeData.name || !badgeData.description) {
      return NextResponse.json({ message: 'Name and description are required' }, { status: 400 });
    }

    // Check if badge name already exists
    const existingBadge = await Badge.findOne({ name: badgeData.name });
    if (existingBadge) {
      return NextResponse.json({ message: 'Badge name already exists' }, { status: 400 });
    }

    // Create the badge
    const newBadge = await Badge.create({
      name: badgeData.name,
      description: badgeData.description,
      icon: badgeData.icon || 'Trophy',
      color: badgeData.color || 'yellow',
      category: badgeData.category || 'achievement',
      rule: badgeData.rule || { type: 'points', value: 1000, operator: 'gte' },
      rarity: badgeData.rarity || 'common',
      isActive: badgeData.isActive !== false,
      order: badgeData.order || 0
    });

    return NextResponse.json({ 
      message: 'Badge created successfully',
      badge: newBadge
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating badge:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
