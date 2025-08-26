import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Load environment variables
if (dev) {
  const dotenv = await import('dotenv');
  dotenv.config();
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://townhall-icebreaker.onrender.com', 'https://*.onrender.com']
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    socket.on('join-room', (pin) => {
      socket.join(pin);
      console.log(`Socket ${socket.id} joined room ${pin}`);
    });

    // Legacy game events - can be removed or updated for new game system
    socket.on('start-game', async (pin) => {
      console.log(`WebSocket: Game start event received for pin: ${pin}`);
      // TODO: Implement new game system
    });

    socket.on('player-joined', (pin) => {
      io.to(pin).emit('player-update');
    });

    socket.on('submit-answer', async ({ pin, playerId, answer }) => {
      console.log(`WebSocket: Answer submitted for pin: ${pin}`);
      // TODO: Implement new game system
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });



  const port = parseInt(process.env.PORT || '3000', 10);
  
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
    console.log(`> Socket.IO server running`);
  });
});