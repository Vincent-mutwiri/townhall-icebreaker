// src/app/api/courses/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { Course } from '@/models/Course';

// GET a single course for editing
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ message: 'Course not found.' }, { status: 404 });
    }

    // Security Check: Ensure the user requesting the course is the one who created it.
    if (course.createdBy.toString() !== (session.user as any).id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// PATCH to update a course (e.g., add modules, change title)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await request.json();

    // Clean up module IDs - remove temporary string IDs and let MongoDB generate proper ones
    if (body.modules) {
      body.modules = body.modules.map((module: any) => {
        const cleanModule = { ...module };
        // Remove temporary string IDs that aren't valid ObjectIds
        if (cleanModule._id && typeof cleanModule._id === 'string' && !cleanModule._id.match(/^[0-9a-fA-F]{24}$/)) {
          delete cleanModule._id;
        }
        return cleanModule;
      });
    }

    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ message: 'Course not found.' }, { status: 404 });
    }

    // Security Check!
    if (course.createdBy.toString() !== (session.user as any).id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Update the course with the new data from the request body
    const updatedCourse = await Course.findByIdAndUpdate(id, body, { new: true });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// DELETE a course
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const course = await Course.findById(id);

    if (!course) {
      return NextResponse.json({ message: 'Course not found.' }, { status: 404 });
    }

    // Security Check!
    if (course.createdBy.toString() !== (session.user as any).id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    await Course.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
