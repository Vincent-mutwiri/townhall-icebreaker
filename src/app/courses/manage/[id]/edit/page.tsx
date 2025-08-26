// src/app/courses/manage/[id]/edit/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { Course } from "@/models/Course";
import { CourseEditor } from "@/components/courses/CourseEditor"; // We will create this next

async function getCourseData(courseId: string, userId: string) {
  if (courseId === 'new') {
    return null; // This is a new course
  }
  
  await connectToDatabase();
  const course = await Course.findById(courseId);

  if (!course || course.createdBy.toString() !== userId) {
    return null; // Or handle as an error
  }
  
  return JSON.parse(JSON.stringify(course));
}

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const courseData = await getCourseData(id, (session.user as any).id);

  // If an ID is provided but no course is found (or user is not owner), redirect
  if (id !== 'new' && !courseData) {
    redirect('/courses/manage');
  }

  return <CourseEditor initialCourse={courseData} />;
}
