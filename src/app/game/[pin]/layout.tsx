import { BackgroundWrapper } from "@/components/game/BackgroundWrapper";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <BackgroundWrapper className="min-h-screen">
      <div className="min-h-screen bg-black/20 backdrop-blur-sm">
        {children}
      </div>
    </BackgroundWrapper>
  );
}