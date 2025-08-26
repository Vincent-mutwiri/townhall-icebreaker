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
          message: 'Game is starting!'
        });

        // Send first question after a brief delay
        setTimeout(() => {
          io.to(joinCode).emit('game:question', {
            question: {
              text: firstQuestion.text,
              options: firstQuestion.options,
              questionIndex: 0,
              totalQuestions: questions.length,
              timeLimit: template.rules?.timeLimit || 30
            },
            timeLimit: template.rules?.timeLimit || 30
          });
        }, 3000); // 3 second delay to let players get ready

        console.log(`Game ${joinCode} started successfully`);
      } catch (error) {
        console.error('Error starting game:', error);
        socket.emit('error', { message: 'Failed to start game' });
      }
    });

    socket.on('player:answer', async ({ joinCode, answer, timeRemaining, timestamp }) => {
      console.log(`WebSocket: Answer submitted for game: ${joinCode}`);
      try {
        const { HostedGame } = await import('./src/models/HostedGame');
        await import('./src/lib/database').then(m => m.default());

        // Find the game and current question
        const hostedGame = await HostedGame.findOne({ joinCode, status: 'live' })
          .populate('templateId');

        if (!hostedGame) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        const template = hostedGame.templateId;
        const currentQuestion = template.questions[hostedGame.currentQuestionIndex];
        const playerIndex = hostedGame.players.findIndex((p: any) => p.userId.toString() === (socket as any).userId);

        if (playerIndex === -1) {
          socket.emit('error', { message: 'Player not found in game' });
          return;
        }

        // Calculate response time and points
        const responseTime = Date.now() - timestamp;
        const isCorrect = answer === currentQuestion.correctAnswer;
        let pointsEarned = 0;

        if (isCorrect) {
          const basePoints = template.rules?.basePoints || 100;
          const timeBonusMax = template.rules?.timeBonusMax || 50;
          const timeLimit = template.rules?.timeLimit || 30;

          // Calculate time bonus (faster answers get more points)
          const timeBonus = Math.round((timeRemaining / timeLimit) * timeBonusMax);
          pointsEarned = basePoints + timeBonus;
        }

        // Update player's answer and score
        await HostedGame.updateOne(
          {
            _id: hostedGame._id,
            'players.userId': (socket as any).userId
          },
          {
            $set: {
              'players.$.hasAnswered': true,
              'players.$.lastAnswer': answer,
              'players.$.lastResponseTime': responseTime
            },
            $inc: {
              'players.$.score': pointsEarned
            }
          }
        );

        // Check if all players have answered
        const updatedGame = await HostedGame.findById(hostedGame._id);
        const allAnswered = updatedGame.players.every((p: any) => p.hasAnswered);

        if (allAnswered) {
          // Process round results
          setTimeout(() => {
            processRoundResults(joinCode, io);
          }, 2000); // Give a moment for UI updates
        }

      } catch (error) {
        console.error('Error processing answer:', error);
        socket.emit('error', { message: 'Failed to process answer' });
      }
    });

    socket.on('host:next-question', async (joinCode) => {
      console.log(`WebSocket: Host requesting next question for: ${joinCode}`);
      try {
        await processNextQuestion(joinCode, io);
      } catch (error) {
        console.error('Error processing next question:', error);
        socket.emit('error', { message: 'Failed to load next question' });
      }
    });

    socket.on('player-joined', (joinCode) => {
      // Notify all players in the room that someone joined
      socket.to(joinCode).emit('player-update');
    });

    // Store user ID on socket for answer processing
    socket.on('authenticate', (userId) => {
      (socket as any).userId = userId;
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

// Game processing functions
async function processRoundResults(joinCode: string, io: any) {
  try {
    const { HostedGame } = await import('./src/models/HostedGame');
    await import('./src/lib/database').then(m => m.default());

    const hostedGame = await HostedGame.findOne({ joinCode, status: 'live' })
      .populate('templateId');

    if (!hostedGame) return;

    const template = hostedGame.templateId;
    const currentQuestion = template.questions[hostedGame.currentQuestionIndex];

    // Calculate results for each player
    const playerResults = hostedGame.players.map((player: any) => {
      const isCorrect = player.lastAnswer === currentQuestion.correctAnswer;
      let pointsEarned = 0;

      if (isCorrect) {
        const basePoints = template.rules?.basePoints || 100;
        const timeBonusMax = template.rules?.timeBonusMax || 50;
        const timeLimit = template.rules?.timeLimit || 30;
        const responseTimeSeconds = (player.lastResponseTime || 30000) / 1000;
        const timeBonus = Math.max(0, Math.round(((timeLimit - responseTimeSeconds) / timeLimit) * timeBonusMax));
        pointsEarned = basePoints + timeBonus;
      }

      return {
        userId: player.userId,
        playerName: player.name,
        answer: player.lastAnswer,
        isCorrect,
        responseTime: player.lastResponseTime || 0,
        pointsEarned,
        totalScore: player.score
      };
    });

    // Sort by points earned this round, then by response time
    playerResults.sort((a, b) => {
      if (a.pointsEarned !== b.pointsEarned) {
        return b.pointsEarned - a.pointsEarned;
      }
      return a.responseTime - b.responseTime;
    });

    // Send round results
    io.to(joinCode).emit('game:round-results', {
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      playerResults,
      questionIndex: hostedGame.currentQuestionIndex,
      totalQuestions: template.questions.length
    });

    // Reset player answer states
    await HostedGame.updateOne(
      { _id: hostedGame._id },
      {
        $set: {
          'players.$[].hasAnswered': false,
          'players.$[].lastAnswer': null,
          'players.$[].lastResponseTime': null
        }
      }
    );

  } catch (error) {
    console.error('Error processing round results:', error);
  }
}

async function processNextQuestion(joinCode: string, io: any) {
  try {
    const { HostedGame } = await import('./src/models/HostedGame');
    await import('./src/lib/database').then(m => m.default());

    const hostedGame = await HostedGame.findOne({ joinCode, status: 'live' })
      .populate('templateId');

    if (!hostedGame) return;

    const template = hostedGame.templateId;
    const nextQuestionIndex = hostedGame.currentQuestionIndex + 1;

    if (nextQuestionIndex >= template.questions.length) {
      // Game finished
      await finishGame(joinCode, io);
      return;
    }

    // Update current question index
    await HostedGame.updateOne(
      { _id: hostedGame._id },
      { currentQuestionIndex: nextQuestionIndex }
    );

    const nextQuestion = template.questions[nextQuestionIndex];

    // Send next question
    io.to(joinCode).emit('game:next-question', {
      question: {
        text: nextQuestion.text,
        options: nextQuestion.options,
        questionIndex: nextQuestionIndex,
        totalQuestions: template.questions.length
      },
      timeLimit: template.rules?.timeLimit || 30
    });

  } catch (error) {
    console.error('Error processing next question:', error);
  }
}

async function finishGame(joinCode: string, io: any) {
  try {
    const { HostedGame } = await import('./src/models/HostedGame');
    const { Result } = await import('./src/models/Result');
    const { User } = await import('./src/models/User');
    await import('./src/lib/database').then(m => m.default());

    const hostedGame = await HostedGame.findOne({ joinCode, status: 'live' })
      .populate('templateId');

    if (!hostedGame) return;

    // Update game status to finished
    await HostedGame.updateOne(
      { _id: hostedGame._id },
      {
        status: 'finished',
        finishedAt: new Date()
      }
    );

    // Calculate final leaderboard
    const finalLeaderboard = hostedGame.players
      .map((player: any) => ({
        userId: player.userId,
        name: player.name,
        score: player.score,
        correctAnswers: 0 // We'll calculate this properly in a future enhancement
      }))
      .sort((a, b) => b.score - a.score);

    // Import points economy functions
    const { checkPointsCap, checkGameHostEligibility } = await import('./src/lib/pointsEconomy');

    // Check if host should get points (anti-farming measure)
    const hostEligibility = await checkGameHostEligibility(hostedGame.players.length);

    // Award points to all players and create Result documents
    for (const player of hostedGame.players) {
      if (player.score > 0) {
        // Check points caps before awarding
        const pointsCheck = await checkPointsCap(player.userId, player.score);
        const actualPointsAwarded = pointsCheck.actualPoints;

        // Create result document
        await Result.create({
          userId: player.userId,
          source: 'game',
          sourceId: hostedGame._id,
          score: Math.round((player.score / (hostedGame.templateId.questions.length * (hostedGame.templateId.rules?.basePoints || 100))) * 100),
          pointsAwarded: actualPointsAwarded,
          details: {
            gameTitle: hostedGame.templateId.title,
            joinCode: hostedGame.joinCode,
            finalRank: finalLeaderboard.findIndex((p: any) => p.userId.toString() === player.userId.toString()) + 1,
            totalPlayers: hostedGame.players.length,
            originalPoints: player.score,
            capReason: pointsCheck.reason
          }
        });

        // Update user points
        await User.updateOne(
          { _id: player.userId },
          {
            $inc: {
              points: actualPointsAwarded,
              'stats.gamesPlayed': 1
            }
          }
        );
      }
    }

    // Award host points if eligible
    if (hostEligibility.canAwardHostPoints) {
      const hostPoints = 50; // Base host points
      const hostPointsCheck = await checkPointsCap(hostedGame.hostId, hostPoints);
      const actualHostPoints = hostPointsCheck.actualPoints;

      if (actualHostPoints > 0) {
        // Create result document for host
        await Result.create({
          userId: hostedGame.hostId,
          source: 'game',
          sourceId: hostedGame._id,
          score: 100, // Host gets 100% for hosting
          pointsAwarded: actualHostPoints,
          details: {
            type: 'host_bonus',
            gameTitle: hostedGame.templateId.title,
            joinCode: hostedGame.joinCode,
            totalPlayers: hostedGame.players.length,
            originalPoints: hostPoints,
            capReason: hostPointsCheck.reason
          }
        });

        // Update host points
        await User.updateOne(
          { _id: hostedGame.hostId },
          {
            $inc: {
              points: actualHostPoints,
              'stats.gamesHosted': 1
            }
          }
        );
      }
    }

    // Send final results
    io.to(joinCode).emit('game:finished', {
      finalLeaderboard,
      players: hostedGame.players,
      gameStats: {
        totalQuestions: hostedGame.templateId.questions.length,
        totalPlayers: hostedGame.players.length,
        gameTitle: hostedGame.templateId.title
      }
    });

    console.log(`Game ${joinCode} finished successfully`);

  } catch (error) {
    console.error('Error finishing game:', error);
  }
}