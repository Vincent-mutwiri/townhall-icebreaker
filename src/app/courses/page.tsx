// src/app/courses/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Settings, Play, User } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserLayout } from "@/components/layouts/UserLayout";
import connectToDatabase from "@/lib/database";
import { Course } from "@/models/Course";

async function getPublishedCourses() {
  await connectToDatabase();
  const courses = await Course.find({ status: 'published' }).sort({ createdAt: -1 }).populate('createdBy', 'name');
  return JSON.parse(JSON.stringify(courses));
}

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  const publishedCourses = await getPublishedCourses();

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Courses</h1>
        <p className="text-muted-foreground mb-6">
          Explore educational content and manage your courses
        </p>
      </div>

      {/* Published Courses for Students */}
      {publishedCourses.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Available Courses</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {publishedCourses.map((course: any) => (
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
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Published</Badge>
                    <span className="text-sm text-muted-foreground">
                      {course.modules?.length || 0} modules
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3 mb-4">
                    {course.description}
                  </CardDescription>
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>By {course.createdBy?.name || 'Unknown'}</span>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href={`/courses/${course._id}`}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Course
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Management Options */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {publishedCourses.length === 0 && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                No Courses Available
              </CardTitle>
              <CardDescription>
                There are no published courses yet. Check back later!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                No Courses Yet
              </Button>
            </CardContent>
          </Card>
        )}

        {session?.user && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Manage Courses
              </CardTitle>
              <CardDescription>
                Create and manage your own courses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/courses/manage">
                  Manage Your Courses
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </UserLayout>
  );
}
