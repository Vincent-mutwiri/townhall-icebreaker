// src/app/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, LogOut, BookOpen, Gamepad2, Trophy, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
            Townhall Icebreaker
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Learn, Play, and Grow Together
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl w-full">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Courses
              </CardTitle>
              <CardDescription>
                Interactive learning modules and educational content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/courses">
                <Button className="w-full">Explore Courses</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-green-600" />
                Games
              </CardTitle>
              <CardDescription>
                Create and play educational games with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/games">
                <Button className="w-full">Play Games</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                See how you rank against other learners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/leaderboard">
                <Button className="w-full">View Rankings</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Updates
              </CardTitle>
              <CardDescription>
                Latest news and community updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/updates">
                <Button className="w-full">Read Updates</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isAuthenticated ? (
            <>
              <div className="bg-white/90 backdrop-blur-sm rounded px-3 py-2 text-sm font-medium">
                Welcome, {user?.name}!
              </div>
              <Button
                onClick={() => signOut()}
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
                  <User className="mr-2 h-4 w-4" />
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
          {isAuthenticated && (
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
                Dashboard
              </Button>
            </Link>
          )}
          <Link href="/admin">
            <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}