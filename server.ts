import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { gameController } from './src/lib/gameController';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  gameController.setIO(io);

  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    socket.on('join-room', (pin) => {
      socket.join(pin);
      console.log(`Socket ${socket.id} joined room ${pin}`);
    });

    socket.on('start-game', async (pin) => {
      console.log(`WebSocket: Starting game for pin: ${pin}`);
      
      try {
        // Get the game data with questions
        const { Game } = await import('./src/models/Game');
        const connectToDatabase = (await import('./src/lib/database')).default;
        
        await connectToDatabase();
        const game = await Game.findOne({ pin }).populate('players').populate('questions');
        
        if (game) {
          // Broadcast game data to all clients in the room
          io.to(pin).emit('game-state-update', {
            game: JSON.parse(JSON.stringify(game)),
            view: 'question'
          });
          console.log(`Broadcasted game start with data to room ${pin}`);
          
          // Start the round timer
          setTimeout(async () => {
            console.log(`Round timer expired for ${pin}, processing results`);
            await processRound(pin, io);
          }, 15000); // 15 seconds
        }
      } catch (error) {
        console.error(`Error broadcasting game start for ${pin}:`, error);
      }
    });

    socket.on('player-joined', (pin) => {
      io.to(pin).emit('player-update');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });

  // Round processing function
  async function processRound(pin: string, io: any) {
    try {
      const { Game } = await import('./src/models/Game');
      const { Player } = await import('./src/models/Player');
      const connectToDatabase = (await import('./src/lib/database')).default;
      
      await connectToDatabase();
      const game = await Game.findOne({ pin }).populate('players').populate('questions');
      if (!game) return;

      const currentQuestion = game.questions[game.currentQuestionIndex];
      const survivors: string[] = [];
      const eliminated: string[] = [];

      const activePlayers = await Player.find({ game: game._id, isEliminated: false });
      
      for (const player of activePlayers) {
        const answeredCorrectly = player.lastAnswer?.questionId?.toString() === currentQuestion._id.toString() && player.lastAnswer.isCorrect;

        if (answeredCorrectly) {
          survivors.push(player.name);
        } else {
          eliminated.push(player.name);
          await Player.updateOne({ _id: player._id }, { $set: { isEliminated: true } });
        }
      }

      console.log(`Round processed: ${survivors.length} survivors, ${eliminated.length} eliminated`);

      // Broadcast results
      io.to(pin).emit('game-state-update', {
        view: 'results',
        roundResults: { survivors, eliminated }
      });

      // Next question after 5 seconds
      setTimeout(async () => {
        await nextQuestion(pin, io);
      }, 5000);
      
    } catch (error) {
      console.error('Error processing round:', error);
    }
  }

  async function nextQuestion(pin: string, io: any) {
    try {
      const { Game } = await import('./src/models/Game');
      const { Player } = await import('./src/models/Player');
      const connectToDatabase = (await import('./src/lib/database')).default;
      
      await connectToDatabase();
      const game = await Game.findOne({ pin }).populate('players').populate('questions');
      if (!game) return;

      const freshPlayers = await Player.find({ game: game._id });
      const activePlayers = freshPlayers.filter(p => !p.isEliminated);
      const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

      if (activePlayers.length <= 1 || isLastQuestion) {
        // Game over
        game.status = 'finished';
        await game.save();
        
        const allPlayers = await Player.find({ game: game._id }).sort({ score: -1 });
        const winners = allPlayers.map(p => ({
          _id: p._id,
          name: p.name,
          score: p.score || 0
        }));

        io.to(pin).emit('game-state-update', {
          view: 'finished',
          winners
        });
      } else {
        // Next question
        game.currentQuestionIndex += 1;
        game.prizePool += game.incrementAmount;
        await game.save();
        
        // Clear previous answers
        await Player.updateMany({ game: game._id }, { $unset: { lastAnswer: 1 } });
        
        const updatedGame = await Game.findById(game._id).populate('players').populate('questions');
        
        io.to(pin).emit('game-state-update', {
          game: JSON.parse(JSON.stringify(updatedGame)),
          view: 'question'
        });
        
        console.log(`Started question ${game.currentQuestionIndex + 1} for game ${pin}`);
        
        // Start timer for next round
        setTimeout(async () => {
          await processRound(pin, io);
        }, 15000);
      }
    } catch (error) {
      console.error('Error in nextQuestion:', error);
    }
  }

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});