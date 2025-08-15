"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

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
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
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

  const handleCanPlay = useCallback(() => {
    setIsLoaded(true);
    setIsBuffering(false);
    
    if (audioRef.current) {
      // Start muted autoplay immediately
      audioRef.current.muted = true;
      audioRef.current.volume = volume;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Muted autoplay failed - will start on user interaction
      });
    }
  }, [volume]);

  const handleError = () => {
    console.error('Audio loading failed');
    setIsLoaded(false);
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const togglePlay = async () => {
    if (!audioRef.current || !isLoaded) return;
    
    if (!userInteracted) {
      setUserInteracted(true);
      if (!isMuted && audioRef.current.muted) {
        audioRef.current.muted = false;
        audioRef.current.volume = volume;
      }
    }

    if (isPlaying) {
      // Wait for any pending play promise before pausing
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch {
          // Ignore errors from previous play attempts
        }
        playPromiseRef.current = null;
      }
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!isMuted) {
        audioRef.current.muted = false;
        audioRef.current.volume = volume;
      }
      
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {});
      }
      
      playPromiseRef.current = audioRef.current.play();
      playPromiseRef.current.then(() => {
        setIsPlaying(true);
        playPromiseRef.current = null;
      }).catch(() => {
        console.error("Play failed");
        setIsPlaying(false);
        playPromiseRef.current = null;
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
      audioRef.current.muted = newMuted || !userInteracted;
      if (!newMuted && userInteracted) {
        audioRef.current.volume = volume;
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
    const handleUserInteraction = () => {
      if (!userInteracted && audioRef.current) {
        // If audio isn't loaded yet, wait for it
        if (!isLoaded && audioRef.current.readyState < 3) {
          const waitForLoad = () => {
            if (audioRef.current && audioRef.current.readyState >= 3) {
              setIsLoaded(true);
              processInteraction();
            } else {
              setTimeout(waitForLoad, 100);
            }
          };
          waitForLoad();
          return;
        }
        
        processInteraction();
      }
    };
    
    const processInteraction = () => {
      if (!userInteracted && audioRef.current) {
        setUserInteracted(true);
        
        if (!isMuted) {
          // If audio is already playing (muted), just unmute it
          if (!audioRef.current.paused) {
            audioRef.current.muted = false;
          } 
          // If audio is not playing (muted autoplay failed), start it
          else {
            audioRef.current.muted = false;
            audioRef.current.volume = volume;
            audioRef.current.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              // Handle play failure silently
            });
          }
        }
        
        // Remove all event listeners after first interaction
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('scroll', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      }
    };

    // Listen for any user interaction - only once
    if (!userInteracted) {
      document.addEventListener('click', handleUserInteraction, { once: true });
      document.addEventListener('keydown', handleUserInteraction, { once: true });
      document.addEventListener('scroll', handleUserInteraction, { once: true });
      document.addEventListener('touchstart', handleUserInteraction, { once: true });
    }

    return () => {
      if (!userInteracted) {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('scroll', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      }
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('canplaythrough', handleCanPlay);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [handleCanPlay, isLoaded, isMuted, userInteracted, volume]); // Dependencies for useEffect

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