// src/app/courses/[id]/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { Course } from "@/models/Course";
import { CoursePlayer } from "@/components/courses/CoursePlayer"; // We will create this
import { notFound } from 'next/navigation';

async function getCourseForStudent(courseId: string) {
  await connectToDatabase();
  // We only fetch 'published' courses for students
  const course = await Course.findOne({ _id: courseId, status: 'published' });
  if (!course) {
    return null;
  }
  return JSON.parse(JSON.stringify(course));
}

export default async function CoursePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const courseData = await getCourseForStudent(id);

  if (!courseData) {
    notFound();
  }

  return <CoursePlayer course={courseData} userId={(session.user as any).id} />;
}
