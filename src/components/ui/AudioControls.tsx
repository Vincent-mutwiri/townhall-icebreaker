"use client";

import { useAudio } from "@/context/AudioProvider";
import { Button } from "./button";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { useState } from "react";

export function AudioControls({ className = "" }: { className?: string }) {
  const { isPlaying, isMuted, volume, isLoaded, isBuffering, togglePlay, toggleMute, setVolume } = useAudio();
  const [showVolume, setShowVolume] = useState(false);

  if (!isLoaded) {
    return (
      <div className={`bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg ${className}`}>
        <div className="h-8 w-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className={`bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg flex items-center space-x-2 ${className}`}
      onMouseEnter={() => setShowVolume(true)}
      onMouseLeave={() => setShowVolume(false)}
    >
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={togglePlay}
        className="h-8 w-8"
        title={`${isPlaying ? "Pause music" : "Play music"} (Ctrl+Space)`}
        disabled={isBuffering}
      >
        {isBuffering ? (
          <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleMute}
        className="h-8 w-8"
        title={`${isMuted ? "Unmute" : "Mute"} (Ctrl+M)`}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      
      {(showVolume || !isMuted) && (
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
          <span className="text-xs text-gray-600 w-8 text-center">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}