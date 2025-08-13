import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { getVoteWinner } from './src/lib/vote-utils.ts';
import { Game } from './src/models/Game.ts';
import { Player } from './src/models/Player.ts';
import connectToDatabase from './src/lib/database.ts';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const ROUND_DURATION_MS = 15000; // 15 seconds
const RESULTS_DURATION_MS = 5000; // 5 seconds
const VOTE_DURATION_MS = 10000; // 10 seconds

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

  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);

    socket.on('join-room', (pin) => {
      socket.join(pin);
      console.log(`Socket ${socket.id} joined room ${pin}`);
    });

    socket.on('start-game', (pin, gameData) => {
      console.log(`Game start event received for room: ${pin}`);
      io.to(pin).emit('game-started', gameData);
      startRoundTimer(pin);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });

  function startRoundTimer(pin: string) {
    console.log(`Round timer started for game ${pin}.`);
    setTimeout(() => processRoundEnd(pin), ROUND_DURATION_MS);
  }

  async function processRoundEnd(pin: string) {
    console.log(`Round ended for game ${pin}. Processing results...`);
    try {
      await connectToDatabase();
      // Use .populate on the 'questions' field to access question data
      const game = await Game.findOne({ pin }).populate('players').populate('questions');
      if (!game) return;

      const currentQuestion: any = game.questions[game.currentQuestionIndex]; // eslint-disable-line @typescript-eslint/no-explicit-any
      const roundStartTime = new Date(Date.now() - ROUND_DURATION_MS); // Approx. start time
      const survivors: string[] = [];
      const eliminatedThisRound: string[] = [];

      for (const player of game.players) {
        if (player.isEliminated) continue;

        const answeredCorrectly =
          player.lastAnswer?.questionId?.toString() === currentQuestion?._id?.toString() &&
          player.lastAnswer?.isCorrect;

        if (answeredCorrectly) {
          survivors.push(player.name);

          // --- SCORE CALCULATION ---
          const timeTakenMs = player.lastAnswer.submittedAt.getTime() - roundStartTime.getTime();
          const timeBonus = Math.max(0, Math.floor((ROUND_DURATION_MS - timeTakenMs) / 1000) * 10); // 10 points per second left
          const pointsAwarded = 100 + timeBonus; // 100 base points

          await Player.updateOne({ _id: player._id }, { $inc: { score: pointsAwarded } });
          // --- END OF SCORE CALCULATION ---

        } else {
          eliminatedThisRound.push(player.name);
          await Player.updateOne({ _id: player._id }, { $set: { isEliminated: true } });
        }
      }

      io.to(pin).emit('round-results', { survivors, eliminated: eliminatedThisRound });
      setTimeout(() => startVotingRound(pin), RESULTS_DURATION_MS);

    } catch (error) {
      console.error(`Error processing round for game ${pin}:`, error);
    }
  }

  async function startVotingRound(pin: string) {
    console.log(`Starting voting round for game ${pin}.`);
    try {
      await connectToDatabase();
      // Get all players who have ever been eliminated
      const gameDoc = await Game.findOne({ pin });
      if (!gameDoc) return;

      const eliminatedPlayers = await Player.find({ game: gameDoc._id, isEliminated: true });

      if (eliminatedPlayers.length === 0) {
        console.log(`No one to vote for in game ${pin}. Moving to next round.`);
        // If no one is eliminated, skip voting and go to the next round
        setTimeout(() => startNextRound(pin), 1000); // Short delay
        return;
      }

      io.to(pin).emit('voting-started', { eliminatedPlayers: JSON.parse(JSON.stringify(eliminatedPlayers)) });

      // Start timer to end the voting round
      setTimeout(() => processVoteEnd(pin), VOTE_DURATION_MS);

    } catch (error) {
      console.error(`Error starting voting for game ${pin}:`, error);
    }
  }

  async function processVoteEnd(pin: string) {
    console.log(`Voting ended for game ${pin}.`);
    const winnerId = getVoteWinner(pin);

    if (winnerId) {
      // We have a winner, redeem them!
      await connectToDatabase();
      await Player.updateOne({ _id: winnerId }, { $set: { isEliminated: false } });
      const redeemedPlayer = await Player.findById(winnerId);
      io.to(pin).emit('player-redeemed', { name: redeemedPlayer?.name });
    } else {
      // No one was redeemed
      io.to(pin).emit('player-redeemed', { name: null });
    }

    // Wait a moment before starting the next round
    setTimeout(() => startNextRound(pin), 3000);
  }

  async function startNextRound(pin: string) {
    console.log(`Starting next round for game ${pin}.`);
    await connectToDatabase();
    const game = await Game.findOne({ pin });
    if (!game) return;

    // Check for win condition
    const activePlayers = await Player.find({ game: game._id, isEliminated: false }).sort({ score: -1 });

    const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;
    const isOneOrLessPlayerLeft = activePlayers.length <= 1;

    if (isLastQuestion || isOneOrLessPlayerLeft) {
      console.log(`Game over for game ${pin}.`);
      await Game.updateOne({ _id: game._id }, { $set: { status: 'finished' } });
      io.to(pin).emit('game-over', { winners: JSON.parse(JSON.stringify(activePlayers)) });
      return;
    }

    // Move to the next question
    game.currentQuestionIndex += 1;
    await game.save();

    const gameWithNextQuestion = await Game.findById(game._id).populate('questions');
    io.to(pin).emit('next-round-started', { game: JSON.parse(JSON.stringify(gameWithNextQuestion)) });

    // Start the timer for the new round
    startRoundTimer(pin);
  }

  const port = process.env.PORT || 3000;
  httpServer.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});