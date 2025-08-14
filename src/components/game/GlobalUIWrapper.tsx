"use client";

import { useSettings } from "@/context/SettingsProvider";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Volume2, VolumeX } from "lucide-react";

export function GlobalUIWrapper({ children }: { children: React.ReactNode }) {
  const { backgroundUrl, musicUrl, isLoading } = useSettings();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    if (musicUrl) {
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Create new audio element
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = volume;
      audioRef.current.preload = 'auto';
      
      audioRef.current.addEventListener('canplaythrough', () => {
        setAudioLoaded(true);
      });
      
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio loading failed:', e);
        setAudioLoaded(false);
      });
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [musicUrl, volume]);

  const toggleMute = () => {
    if (audioRef.current && audioLoaded) {
      if (isMuted) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
      setIsMuted(!isMuted);
    }
  };
  
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const backgroundStyle = backgroundUrl ? {
    backgroundImage: `url(${backgroundUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } : {};

  const isVideo = backgroundUrl?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div className="relative min-h-screen transition-all duration-500" style={!isVideo ? backgroundStyle : {}}>
      {isVideo && (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover -z-10 transition-opacity duration-500"
            onLoadStart={() => console.log('Video loading...')}
            onCanPlay={() => console.log('Video ready to play')}
          >
            <source src={backgroundUrl} type={`video/${backgroundUrl.split('.').pop()}`} />
          </video>
          {/* Overlay for better text readability */}
          <div className="absolute top-0 left-0 w-full h-full bg-black/20 -z-5" />
        </>
      )}
      {musicUrl && (
        <div className="absolute top-4 right-4 z-50 flex items-center space-x-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              disabled={!audioLoaded}
              className="h-8 w-8"
            >
              {!audioLoaded ? (
                <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            {!isMuted && audioLoaded && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            )}
          </div>
        </div>
      )}
      <main className="relative z-10">
        {isLoading && (
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <div className="flex items-center space-x-2 text-sm">
              <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading settings...</span>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}