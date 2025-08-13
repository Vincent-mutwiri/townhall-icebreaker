// src/app/page.tsx
import { CreateGameForm } from "@/components/game/CreateGameForm";
import { JoinGameForm } from "@/components/game/JoinGameForm";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-50 dark:bg-black p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight lg:text-6xl">
          Townhall Icebreaker
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          The real-time trivia game for your whole team.
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-8">
        <CreateGameForm />
        <div className="flex items-center h-full">
          <Separator orientation="vertical" className="hidden md:block h-20" />
          <div className="md:hidden">OR</div>
          <Separator orientation="horizontal" className="block md:hidden w-20" />
        </div>
        <JoinGameForm />
      </div>
    </main>
  );
}