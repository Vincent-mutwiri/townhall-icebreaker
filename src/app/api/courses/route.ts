// src/app/api/courses/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from '@/lib/database';
import { Course } from '@/models/Course';
import { User } from '@/models/User'; // Ensure User model is imported

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const courses = await Course.find({ createdBy: (session.user as any).id }).sort({ createdAt: -1 });
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json({ message: 'Title and description are required.' }, { status: 400 });
    }

    const newCourse = new Course({
      title,
      description,
      createdBy: (session.user as any).id,
      status: 'draft',
      modules: [], // Start with an empty array of modules
    });

    await newCourse.save();

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
