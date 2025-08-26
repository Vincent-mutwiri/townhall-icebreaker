// src/hooks/useSocket.ts
"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection if it doesn't exist
    if (!socket) {
      socket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
        transports: ['websocket', 'polling'],
        upgrade: true,
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
        setIsConnected(true);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });
    }

    // Update connection status if socket already exists
    if (socket.connected) {
      setIsConnected(true);
    }

    // Cleanup function
    return () => {
      // Don't disconnect the socket here as it might be used by other components
      // The socket will be cleaned up when the page is refreshed or closed
    };
  }, []);

  return socket;
}

// Hook to get connection status
export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Set initial state
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  return isConnected;
}
