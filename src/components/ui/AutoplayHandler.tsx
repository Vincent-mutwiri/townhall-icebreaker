"use client";

import { useAudio } from "@/context/AudioProvider";
import { useEffect, useState } from "react";
import { Button } from "./button";
import { Volume2 } from "lucide-react";

export function AutoplayHandler() {
  const { isLoaded, isMuted, toggleMute } = useAudio();
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const checkInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        localStorage.setItem('user-interacted', 'true');
      }
    };

    const hasStoredInteraction = localStorage.getItem('user-interacted') === 'true';
    
    if (hasStoredInteraction) {
      setHasInteracted(true);
    } else {
      document.addEventListener('click', checkInteraction, { once: true });
      document.addEventListener('keydown', checkInteraction, { once: true });
      document.addEventListener('touchstart', checkInteraction, { once: true });
    }

    return () => {
      document.removeEventListener('click', checkInteraction);
      document.removeEventListener('keydown', checkInteraction);
      document.removeEventListener('touchstart', checkInteraction);
    };
  }, [hasInteracted]);

  useEffect(() => {
    if (isLoaded && isMuted && hasInteracted) {
      const autoplayTimer = setTimeout(() => {
        setShowPrompt(true);
      }, 2000);

      return () => clearTimeout(autoplayTimer);
    }
  }, [isLoaded, isMuted, hasInteracted]);

  const handleEnableAudio = () => {
    toggleMute();
    setShowPrompt(false);
  };

  if (!showPrompt || !isLoaded) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="bg-blue-600 text-white rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center space-x-3">
          <Volume2 className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Enable background music?</p>
            <p className="text-xs opacity-90">Enhance your experience with ambient sounds</p>
          </div>
        </div>
        <div className="flex space-x-2 mt-3">
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleEnableAudio}
            className="flex-1"
          >
            Enable
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setShowPrompt(false)}
            className="flex-1 text-white hover:bg-white/20"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}