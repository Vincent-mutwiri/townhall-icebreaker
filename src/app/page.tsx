import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl mb-4">
          Townhall Icebreaker
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          The project setup is complete. Ready to build!
        </p>
        <Button size="lg">Get Started</Button>
      </div>
    </main>
  );
}