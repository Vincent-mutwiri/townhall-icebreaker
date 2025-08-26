// src/app/dashboard/page.tsx
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { CreateGameForm } from '@/components/game/CreateGameForm';
import { JoinGameForm } from '@/components/game/JoinGameForm';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
          Welcome, {session.user?.name}!
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Ready to play? Create a new game or join an existing one.
        </p>
      </div>

      {/* User Stats Card - Future Gamification */}
      <Card className="mb-8 w-full max-w-md">
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-around">
          <div className="text-center">
            <p className="text-2xl font-bold">1</p>
            <p className="text-sm text-muted-foreground">Level</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">XP</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-muted-foreground">Badges</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <CreateGameForm />
        <Separator orientation="vertical" className="hidden md:block h-20" />
        <div className="md:hidden text-muted-foreground font-semibold">OR</div>
        <Separator orientation="horizontal" className="block md:hidden w-20" />
        <JoinGameForm />
      </div>

      {/* Navigation */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Link href="/">
          <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
            Home
          </Button>
        </Link>
        <SignOutButton />
        {session.user?.role === 'admin' && (
          <Link href="/admin">
            <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
              Admin
            </Button>
          </Link>
        )}
      </div>
    </main>
  );
}
