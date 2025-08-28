// src/app/courses/manage/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserLayout } from "@/components/layouts/UserLayout";
import connectToDatabase from "@/lib/database";
import { Course } from "@/models/Course";
import { PlusCircle, BookOpen, Edit, Trash2 } from "lucide-react";

async function getMyCourses(userId: string) {
  await connectToDatabase();
  const courses = await Course.find({ createdBy: userId }).sort({ createdAt: -1 });
  return JSON.parse(JSON.stringify(courses));
}

export default async function ManageCoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  const myCourses = await getMyCourses((session.user as any).id);

  return (
    <UserLayout>
      <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Your Courses</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your educational content
          </p>
        </div>
        <Button asChild>
          <Link href="/courses/manage/new/edit">
            <PlusCircle className="mr-2 h-4 w-4" /> Create New Course
          </Link>
        </Button>
      </div>

      {myCourses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven't created any courses yet. Click "Create New Course" to get started!
          </p>
          <Button asChild>
            <Link href="/courses/manage/new/edit">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Course
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {myCourses.map((course: any) => (
            <Card key={course._id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className="aspect-video w-full overflow-hidden bg-gray-100">
                {course.cover ? (
                  <img 
                    src={course.cover} 
                    alt={course.title}
                    className="w-full h-full object-cover"

                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${course.cover ? 'hidden' : 'flex'}`}>
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                        {course.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {course.modules?.length || 0} modules
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-3 mb-4">
                  {course.description}
                </CardDescription>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/courses/manage/${course._id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Created {new Date(course.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </UserLayout>
  );
}
