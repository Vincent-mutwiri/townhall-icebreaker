// src/app/games/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Play, Settings, Trophy, Users, Zap, Plus } from "lucide-react";
import { JoinGameForm } from "@/components/games/JoinGameForm";

export default async function GamesPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="container mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Games</h1>
        <p className="text-muted-foreground mb-6">
          Create, host, and play live multiplayer educational games
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto mb-12">
        {/* Join Game Card */}
        <JoinGameForm />

        {/* Manage Games Card */}
        {session?.user && (
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Manage Games
              </CardTitle>
              <CardDescription>
                Create and manage your game templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" asChild>
                <Link href="/games/manage">
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Your Games
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-8">Why Play Games?</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-500" />
                Real-Time Competition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Compete with others in live, fast-paced quiz games with instant feedback and scoring.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-blue-500" />
                Earn Points & Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Earn points based on speed and accuracy. Compete for the top spot on leaderboards.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-green-500" />
                Team Building
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Perfect for team meetings, classrooms, and social events. Learn together while having fun.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-4xl mx-auto mt-16">
        <h2 className="text-2xl font-semibold text-center mb-8">How It Works</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="font-semibold mb-2">Create or Join</h3>
            <p className="text-muted-foreground text-sm">
              Teachers create game templates, then host live sessions. Players join with a simple code.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-green-600">2</span>
            </div>
            <h3 className="font-semibold mb-2">Play Together</h3>
            <p className="text-muted-foreground text-sm">
              Answer questions in real-time. Speed and accuracy determine your score and ranking.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl font-bold text-purple-600">3</span>
            </div>
            <h3 className="font-semibold mb-2">Earn & Learn</h3>
            <p className="text-muted-foreground text-sm">
              Gain points, climb leaderboards, and reinforce learning through engaging competition.
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      {!session?.user && (
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to create your own game templates and host live sessions
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>
      )}

      {session?.user && (
        <div className="text-center mt-16 p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Ready to Create?</h3>
          <p className="text-muted-foreground mb-4">
            Start building your first game template and host engaging sessions
          </p>
          <Button size="lg" asChild>
            <Link href="/games/manage/new/edit">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Game
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
