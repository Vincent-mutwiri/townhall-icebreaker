// src/app/api/progress/complete-module/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from '@/lib/database';
import { User } from '@/models/User';
import { Result } from '@/models/Result';
import { Course } from '@/models/Course';
import { Progress } from '@/models/Progress';
import { checkPointsCap } from '@/lib/pointsEconomy';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }
  const userId = (session.user as any).id;

  try {
    await connectToDatabase();
    const { courseId, moduleId, score } = await request.json();

    if (!courseId || !moduleId) {
      return NextResponse.json({ message: 'Course ID and Module ID are required.' }, { status: 400 });
    }

    // 1. Find the user's progress for this course, or create it if it doesn't exist.
    let userProgress = await Progress.findOne({ userId, courseId });
    if (!userProgress) {
      userProgress = new Progress({ userId, courseId, completedModules: [] });
    }

    // 2. Check if the module is already completed to prevent duplicate points.
    if (userProgress.completedModules.includes(moduleId)) {
      return NextResponse.json({ message: 'Module already completed.' });
    }

    // 3. Get the course to check module type for point calculation
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ message: 'Course not found.' }, { status: 404 });
    }

    const module = course.modules.find((m: any) => m._id.toString() === moduleId);
    if (!module) {
      return NextResponse.json({ message: 'Module not found.' }, { status: 404 });
    }

    // 4. Calculate points based on module type and performance
    let pointsAwarded = 50; // Base points for completing any module
    
    if (module.type === 'quiz' && score !== undefined) {
      // Quiz modules: base points + performance bonus
      const performanceBonus = Math.round((score / 100) * 50); // Up to 50 bonus points for perfect score
      pointsAwarded = 50 + performanceBonus;
    } else if (module.type === 'text') {
      // Text modules: standard reading points
      pointsAwarded = 25;
    } else if (module.type === 'video') {
      // Video modules: standard viewing points
      pointsAwarded = 30;
    } else if (module.type === 'assignment') {
      // Assignment modules: higher points for effort
      pointsAwarded = 75;
    }

    // 5. Check points economy caps before awarding
    const pointsCheck = await checkPointsCap(userId, pointsAwarded);
    const actualPointsAwarded = pointsCheck.actualPoints;

    // 6. Create a Result document to log this event.
    await Result.create({
      userId,
      source: 'course',
      sourceId: courseId,
      score: score || 0,
      pointsAwarded: actualPointsAwarded,
      details: {
        moduleId,
        moduleType: module.type,
        moduleTitle: module.title,
        originalPoints: pointsAwarded,
        capReason: pointsCheck.reason
      },
    });

    // 7. Update the user's total points and stats.
    // Using $inc is atomic and safer for concurrent operations.
    await User.updateOne(
      { _id: userId },
      {
        $inc: {
          points: actualPointsAwarded,
          'stats.coursesTaken': 0, // We'll increment this only on full course completion
        },
      }
    );

    // 8. Mark the module as completed in the user's progress.
    userProgress.completedModules.push(moduleId);
    await userProgress.save();

    // 9. Check if the entire course is completed
    const totalModules = course.modules.length;
    const completedModules = userProgress.completedModules.length;
    let courseCompleted = false;
    let courseCompletionPointsAwarded = 0;

    if (completedModules === totalModules) {
      // Award bonus points for course completion
      const courseCompletionBonus = 100;
      const coursePointsCheck = await checkPointsCap(userId, courseCompletionBonus);
      courseCompletionPointsAwarded = coursePointsCheck.actualPoints;

      await User.updateOne(
        { _id: userId },
        {
          $inc: {
            points: courseCompletionPointsAwarded,
            'stats.coursesTaken': 1,
            'stats.coursesCompleted': 1,
          },
        }
      );

      // Create a course completion result
      await Result.create({
        userId,
        source: 'course',
        sourceId: courseId,
        score: 100, // Course completion is always 100%
        pointsAwarded: courseCompletionPointsAwarded,
        details: {
          type: 'course_completion',
          courseTitle: course.title,
          totalModules: totalModules,
          originalPoints: courseCompletionBonus,
          capReason: coursePointsCheck.reason
        },
      });

      courseCompleted = true;
    }

    // 9. (Future) Check for badge awards here.
    // e.g., await checkAndAwardBadges(userId);

    const totalPointsAwarded = actualPointsAwarded + courseCompletionPointsAwarded;

    return NextResponse.json({
      message: courseCompleted ? 'Course completed!' : 'Module completed!',
      pointsAwarded: totalPointsAwarded,
      modulePoints: actualPointsAwarded,
      courseCompletionPoints: courseCompletionPointsAwarded,
      courseCompleted,
      totalProgress: completedModules,
      totalModules,
      pointsCapWarning: pointsCheck.reason
    });

  } catch (error) {
    console.error('Error saving progress:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
