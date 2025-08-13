// src/app/page.tsx
import { CreateGameForm } from "@/components/game/CreateGameForm";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Townhall Icebreaker
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Engage your team with a fun, real-time trivia game.
        </p>
      </div>

      {/* We will add the Join Game form here later */}
      <CreateGameForm />

    </main>
  );
}