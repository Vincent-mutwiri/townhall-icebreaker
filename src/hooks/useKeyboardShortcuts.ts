"use client";

import { useEffect } from 'react';
import { useAudio } from '@/context/AudioProvider';

export function useKeyboardShortcuts() {
  const { toggleMute, togglePlay } = useAudio();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if not typing in an input field
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'm':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            toggleMute();
          }
          break;
        case ' ':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            togglePlay();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleMute, togglePlay]);
}