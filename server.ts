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

    socket.on('join-room', (joinCode) => {
      socket.join(joinCode);
      console.log(`Socket ${socket.id} joined room ${joinCode}`);
    });

    // New game system events
    socket.on('host:start-game', async (joinCode) => {
      console.log(`WebSocket: Host starting game for code: ${joinCode}`);
      try {
        // Import here to avoid circular dependencies
        const { HostedGame } = await import('./src/models/HostedGame');
        const { GameTemplate } = await import('./src/models/GameTemplate');
        await import('./src/lib/database').then(m => m.default());

        // Update game status to live
        const hostedGame = await HostedGame.findOne({ joinCode, status: 'scheduled' })
          .populate('templateId');

        if (!hostedGame) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        // Update game status
        await HostedGame.updateOne(
          { _id: hostedGame._id },
          {
            status: 'live',
            startedAt: new Date(),
            currentQuestionIndex: 0
          }
        );

        // Get the first question
        const template = hostedGame.templateId;
        const questions = template.questions || [];

        if (questions.length === 0) {
          socket.emit('error', { message: 'No questions in this game' });
          return;
        }

        const firstQuestion = questions[0];

        // Emit game started event to all players in the room
        io.to(joinCode).emit('game:started', {
          question: {
            text: firstQuestion.text,
            options: firstQuestion.options,
            questionIndex: 0,
            totalQuestions: questions.length
          },
          timeLimit: template.rules?.timeLimit || 30
        });

        console.log(`Game ${joinCode} started successfully`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    socket.on('player:answer', async ({ joinCode, answer, timeRemaining }) => {
      console.log(`WebSocket: Answer submitted for game: ${joinCode}`);
      // TODO: Implement answer processing in Phase 3, Step 3
    });

    socket.on('player-joined', (joinCode) => {
      // Notify all players in the room that someone joined
      socket.to(joinCode).emit('player-update');
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