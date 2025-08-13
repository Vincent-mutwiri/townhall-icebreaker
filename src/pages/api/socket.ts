// src/pages/api/socket.ts
import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIo } from 'types';
import { Game } from '@/models/Game';
import connectToDatabase from '@/lib/database';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  if (!res.socket.server.io) {
    console.log('*First use, starting Socket.IO');

    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: { origin: '*' }, // Adjust for production
    });

    io.on('connection', (socket) => {
      console.log('A client connected:', socket.id);

      // Player joins a specific game's room
      socket.on('join-room', (pin) => {
        socket.join(pin);
        console.log(`Socket ${socket.id} joined room ${pin}`);
      });

      // A player has successfully joined, now notify the room
      socket.on('player-joined', async (pin) => {
        console.log(`Player joined event received for room: ${pin}`);
        // Fetch the latest game state from the DB
        await connectToDatabase();
        const updatedGame = await Game.findOne({ pin }).populate('players');
        // Broadcast the updated player list to everyone in the room
        io.to(pin).emit('update-lobby', updatedGame.players);
      });

      socket.on('disconnect', () => {
        console.log('A client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO already running');
  }
  res.end();
};

export default ioHandler;