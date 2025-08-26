// src/app/courses/[id]/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectToDatabase from "@/lib/database";
import { Course } from "@/models/Course";
import { User } from "@/models/User";
import { Progress } from "@/models/Progress";
import { CoursePlayer } from "@/components/courses/CoursePlayer";
import { notFound } from 'next/navigation';

async function getCourseForStudent(courseId: string, userId: string) {
  await connectToDatabase();

  // Fetch the course, user, and user's progress for this course in parallel
  const [course, user, userProgress] = await Promise.all([
    Course.findOne({ _id: courseId, status: 'published' }),
    User.findById(userId).select('points'),
    Progress.findOne({ userId, courseId }).select('completedModules')
  ]);

  if (!course || !user) {
    return null;
  }

  const completedModuleIds = userProgress ? userProgress.completedModules.map((id: any) => id.toString()) : [];

  // Augment modules with `isLocked` and `isCompleted` status
  const processedModules = course.modules.map((module: any, index: number) => {
    let isLocked = false;
    const rules = module.lockRules || {};

    // First module is always unlocked
    if (index === 0) {
      isLocked = false;
    } else {
      // Check point requirement
      if (rules.minPoints && user.points < rules.minPoints) {
        isLocked = true;
      }

      // Check required modules requirement
      if (rules.requireModules && rules.requireModules.length > 0) {
        const hasCompletedAllRequired = rules.requireModules.every((reqId: any) =>
          completedModuleIds.includes(reqId.toString())
        );
        if (!hasCompletedAllRequired) {
          isLocked = true;
        }
      }

      // Default behavior: require previous module to be completed
      if (!rules.minPoints && (!rules.requireModules || rules.requireModules.length === 0)) {
        const previousModule = course.modules[index - 1];
        if (previousModule && !completedModuleIds.includes(previousModule._id.toString())) {
          isLocked = true;
        }
      }
    }

    return {
      ...module.toObject(), // Convert Mongoose sub-document to plain object
      isCompleted: completedModuleIds.includes(module._id.toString()),
      isLocked,
    };
  });

  // Replace the original modules with our processed ones
  const courseObject = course.toObject();
  courseObject.modules = processedModules;
  courseObject.userProgress = {
    completedModules: completedModuleIds.length,
    totalModules: course.modules.length,
    userPoints: user.points
  };

  return JSON.parse(JSON.stringify(courseObject));
}

export default async function CoursePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userId = (session.user as any).id;
  const courseData = await getCourseForStudent(id, userId);

  if (!courseData) {
    notFound();
  }

  return <CoursePlayer course={courseData} userId={userId} />;
}
