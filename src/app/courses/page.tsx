// src/app/courses/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Settings } from "lucide-react";

export default function CoursesPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Courses</h1>
        <p className="text-muted-foreground mb-6">
          Explore educational content and manage your courses
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Browse Courses
            </CardTitle>
            <CardDescription>
              Discover and enroll in available courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
