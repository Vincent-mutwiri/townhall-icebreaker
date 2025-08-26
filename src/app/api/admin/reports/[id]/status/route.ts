// src/app/api/admin/reports/[id]/status/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/database';
import { ReportedContent } from '@/models/ReportedContent';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const { status, adminNotes } = await request.json();

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    // Find and update the report
    const updatedReport = await ReportedContent.findByIdAndUpdate(
      id,
      { 
        status,
        adminNotes: adminNotes || '',
        reviewedBy: (session.user as any).id,
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!updatedReport) {
      return NextResponse.json({ message: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Report status updated successfully',
      report: updatedReport
    });

  } catch (error) {
    console.error('Error updating report status:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
