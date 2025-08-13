import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';
import { Game } from '@/models/Game';
import connectToDatabase from '@/lib/database';

// This is the new App Router API route handler
export async function GET(req: Request) {
  if (req.method === 'GET') {
    try {
      // Initialize the HTTP server
      const httpServer = new NetServer();
      
      // Set up Socket.IO
      const io = new ServerIO(httpServer, {
        path: '/api/socket',
        addTrailingSlash: false,
      });

      // Connect to the database
      await connectToDatabase();

      // Socket.IO connection handler
      io.on('connection', (socket) => {
        console.log('New client connected');
        
        // Handle joining a game
        socket.on('joinGame', async ({ gamePin, playerName }) => {
          try {
            const game = await Game.findOne({ pin: gamePin });
            if (!game) {
              socket.emit('error', { message: 'Game not found' });
              return;
            }
            
            // Add player to the game
            game.players.push({
              id: socket.id,
              name: playerName,
              score: 0,
              answer: '',
              hasAnswered: false,
            });
            
            await game.save();
            
            // Join the game room
            socket.join(gamePin);
            
            // Notify all players in the game
            io.to(gamePin).emit('playerJoined', {
              players: game.players,
              playerCount: game.players.length,
            });
            
          } catch (error) {
            console.error('Error joining game:', error);
            socket.emit('error', { message: 'Error joining game' });
          }
        });

        // Handle disconnection
        socket.on('disconnect', async () => {
          console.log('Client disconnected');
          // You might want to handle player disconnection here
        });
      });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }
  
  // Method not allowed
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}