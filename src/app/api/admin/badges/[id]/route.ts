// src/app/api/admin/badges/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { Badge } from '@/models/Badge';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const badgeData = await request.json();

    // Find and update the badge
    const updatedBadge = await Badge.findByIdAndUpdate(
      id,
      {
        name: badgeData.name,
        description: badgeData.description,
        icon: badgeData.icon,
        color: badgeData.color,
        category: badgeData.category,
        rule: badgeData.rule,
        rarity: badgeData.rarity,
        isActive: badgeData.isActive,
        order: badgeData.order
      },
      { new: true }
    );

    if (!updatedBadge) {
      return NextResponse.json({ message: 'Badge not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Badge updated successfully',
      badge: updatedBadge
    });

  } catch (error) {
    console.error('Error updating badge:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;

    // Find and delete the badge
    const deletedBadge = await Badge.findByIdAndDelete(id);

    if (!deletedBadge) {
      return NextResponse.json({ message: 'Badge not found' }, { status: 404 });
    }

    // TODO: Remove this badge from all users who have it
    // This would require updating the User collection to remove the badge reference

    return NextResponse.json({ 
      message: 'Badge deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting badge:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
