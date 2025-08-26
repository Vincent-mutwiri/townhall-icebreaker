// src/components/games/HostGameButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { toast } from "sonner";

interface HostGameButtonProps {
  template: any;
}

export function HostGameButton({ template }: HostGameButtonProps) {
  const router = useRouter();
  const [isHosting, setIsHosting] = useState(false);

  const handleHostGame = async () => {
    if (!template.questions || template.questions.length === 0) {
      toast.error("Cannot host a game with no questions. Please add questions to your template first.");
      return;
    }

    setIsHosting(true);
    try {
      const response = await fetch('/api/games/host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template._id }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to host game');
      }

      toast.success(`Game hosted! Join code: ${data.joinCode}`);
      
      // Redirect to the lobby
      router.push(`/games/play/${data.joinCode}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsHosting(false);
    }
  };

  return (
    <Button 
      size="sm" 
      className="flex-1" 
      onClick={handleHostGame}
      disabled={isHosting}
    >
      <Play className="mr-2 h-4 w-4" />
      {isHosting ? "Hosting..." : "Host Game"}
    </Button>
  );
}
