"use client";

import { useBackgroundSettings } from "@/context/SettingsProvider";
import { AudioControls } from "../ui/AudioControls";
import { AutoplayHandler } from "../ui/AutoplayHandler";
import { useAudio } from "@/context/AudioProvider";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function BackgroundWrapper({ children, className = "" }: { 
  children: React.ReactNode;
  className?: string;
}) {
  const { backgroundUrl } = useBackgroundSettings();
  const { currentTrack } = useAudio();
  useKeyboardShortcuts();

  const backgroundStyle = backgroundUrl ? {
    backgroundImage: `url(${backgroundUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } : {};

  const isVideo = backgroundUrl?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div className={`relative ${className}`} style={!isVideo ? backgroundStyle : {}}>
      {isVideo && (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover -z-10"
          >
            <source src={backgroundUrl} type={`video/${backgroundUrl.split('.').pop()}`} />
          </video>
          <div className="absolute top-0 left-0 w-full h-full bg-black/20 -z-5" />
        </>
      )}
      
      {currentTrack && <AudioControls className="absolute top-4 right-4 z-50" />}
      
      <div className="relative z-10">
        {children}
      </div>
      
      <AutoplayHandler />
    </div>
  );
}