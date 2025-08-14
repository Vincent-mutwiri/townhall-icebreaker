"use client";

import { createContext, useContext, useState, useEffect, useRef } from 'react';

type AudioContextType = {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  isLoaded: boolean;
  isBuffering: boolean;
  togglePlay: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  currentTrack?: string;
};

const AudioContext = createContext<AudioContextType>({
  isPlaying: false,
  isMuted: true,
  volume: 0.3,
  isLoaded: false,
  isBuffering: false,
  togglePlay: () => {},
  toggleMute: () => {},
  setVolume: () => {},
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('audio-muted') === 'true';
    }
    return true;
  });
  const [volume, setVolumeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseFloat(localStorage.getItem('audio-volume') || '0.3');
    }
    return 0.3;
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string>();

  const loadTrack = (url: string) => {
    if (currentTrack === url && audioRef.current) return;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
      audioRef.current.removeEventListener('error', handleError);
      audioRef.current.removeEventListener('ended', handleEnded);
    }

    audioRef.current = new Audio(url);
    audioRef.current.loop = true;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.preload = 'auto';
    
    audioRef.current.addEventListener('canplaythrough', handleCanPlay);
    audioRef.current.addEventListener('error', handleError);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('waiting', () => setIsBuffering(true));
    audioRef.current.addEventListener('canplay', () => setIsBuffering(false));
    
    setCurrentTrack(url);
    setIsLoaded(false);
  };

  const handleCanPlay = () => {
    setIsLoaded(true);
    setIsBuffering(false);
    if (!isMuted && audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error("Auto-play failed:", e);
        setIsPlaying(false);
      });
    }
  };

  const handleError = (e: Event) => {
    console.error('Audio loading failed:', e);
    setIsLoaded(false);
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!audioRef.current || !isLoaded) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(e => {
        console.error("Play failed:", e);
      });
    }
  };

  const fadeAudio = (targetVolume: number, duration: number = 300) => {
    if (!audioRef.current) return Promise.resolve();
    
    return new Promise<void>((resolve) => {
      const startVolume = audioRef.current!.volume;
      const volumeChange = targetVolume - startVolume;
      const steps = 20;
      const stepTime = duration / steps;
      let currentStep = 0;
      
      const fadeInterval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const newVolume = startVolume + (volumeChange * progress);
        
        if (audioRef.current) {
          audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
        }
        
        if (currentStep >= steps) {
          clearInterval(fadeInterval);
          if (audioRef.current) {
            audioRef.current.volume = targetVolume;
          }
          resolve();
        }
      }, stepTime);
    });
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('audio-muted', newMuted.toString());
    
    if (audioRef.current) {
      if (!newMuted && !isPlaying && isLoaded) {
        audioRef.current.volume = 0;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
          fadeAudio(volume, 500);
        }).catch(e => {
          console.error("Play after unmute failed:", e);
        });
      } else if (newMuted && isPlaying) {
        fadeAudio(0, 300).then(() => {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
        });
      } else {
        audioRef.current.volume = newMuted ? 0 : volume;
      }
    }
  };

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume);
    localStorage.setItem('audio-volume', newVolume.toString());
    
    if (audioRef.current && !isMuted) {
      fadeAudio(newVolume, 150);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, []);

  return (
    <AudioContext.Provider value={{
      isPlaying,
      isMuted,
      volume,
      isLoaded,
      isBuffering,
      togglePlay,
      toggleMute,
      setVolume,
      currentTrack,
    }}>
      {children}
      <AudioManager loadTrack={loadTrack} />
    </AudioContext.Provider>
  );
};

const AudioManager = ({ loadTrack }: { loadTrack: (url: string) => void }) => {
  const [musicUrl, setMusicUrl] = useState<string>();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (res.ok && data.musicUrl) {
          setMusicUrl(data.musicUrl);
        }
      } catch (error) {
        console.error("Failed to fetch music settings", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (musicUrl) {
      loadTrack(musicUrl);
    }
  }, [musicUrl, loadTrack]);

  return null;
};