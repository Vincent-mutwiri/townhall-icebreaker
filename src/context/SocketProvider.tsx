// src/context/SocketProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket] = useState<Socket | null>(null);
  const [isConnected] = useState(false);

  useEffect(() => {
    // Socket.IO disabled for now
    console.log('Socket.IO disabled');
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};