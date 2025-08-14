// src/app/page.tsx
import { CreateGameForm } from "@/components/game/CreateGameForm";
import { JoinGameForm } from "@/components/game/JoinGameForm";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BackgroundWrapper } from "@/components/game/BackgroundWrapper";
import { LogoDisplay } from "@/components/game/LogoDisplay";
import { Settings } from "lucide-react";
import Link from "next/link";

export default function Home() {
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
        
        <div className="absolute top-4 right-4">
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