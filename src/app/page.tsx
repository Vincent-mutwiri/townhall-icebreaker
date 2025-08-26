// src/app/page.tsx
"use client";

import { useState } from "react";
import { CreateGameForm } from "@/components/game/CreateGameForm";
import { JoinGameForm } from "@/components/game/JoinGameForm";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BackgroundWrapper } from "@/components/game/BackgroundWrapper";
import { LogoDisplay } from "@/components/game/LogoDisplay";
import { Settings, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth/react";

export default function Home() {
  const [showHostCard, setShowHostCard] = useState(false);
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <BackgroundWrapper className="min-h-screen">
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center">
            <LogoDisplay className="h-16 w-auto max-w-xs" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight lg:text-6xl text-white drop-shadow-lg">
            Townhall Icebreaker
          </h1>
          <p className="text-lg text-white/90 mt-2 drop-shadow">
            The real-time trivia game for your whole team.
          </p>
        </div>

        <div className="flex flex-col items-center gap-8">
          {showHostCard ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl">
                <CreateGameForm />
              </div>
              <div className="flex items-center h-full">
                <Separator orientation="vertical" className="hidden md:block h-20 bg-white/50" />
                <div className="md:hidden text-white font-semibold">OR</div>
                <Separator orientation="horizontal" className="block md:hidden w-20 bg-white/50" />
              </div>
              <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl">
                <JoinGameForm />
              </div>
            </div>
          ) : (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl">
              <JoinGameForm />
            </div>
          )}
        </div>
        
        <div className="absolute top-4 left-4">
          <Button 
            onClick={() => setShowHostCard(!showHostCard)}
            variant="outline" 
            size="sm" 
            className="bg-white/90 backdrop-blur-sm"
          >
            {showHostCard ? 'Hide Host' : 'Host'}
          </Button>
        </div>
        
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
          <Link href="/admin">
            <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm">
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          </Link>
        </div>
      </main>
    </BackgroundWrapper>
  );
}