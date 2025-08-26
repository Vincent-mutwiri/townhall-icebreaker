// src/lib/gameController.ts
import { Server } from 'socket.io';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';
import connectToDatabase from '@/lib/database';
import { sanitizeForLog, validatePin, validatePlayerId, validateAnswer } from './validation';

// Question round duration in milliseconds (15 seconds)
const ROUND_DURATION_MS = 15000;

class GameController {
  private io: Server | null = null;
  private processingRounds: Set<string> = new Set();
  private timerIntervals: Map<string, NodeJS.Timeout> = new Map();

  setIO(io: Server) {
    this.io = io;
  }

  async startGame(pin: string) {
    if (!validatePin(pin)) {
      console.log('Invalid pin format');
      return;
    }
    console.log(`GameController.startGame called for pin: ${sanitizeForLog(pin)}`);
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    
    if (!game) {
      console.log(`No game found for pin: ${pin}`);
      return;
    }
    
    if (game.status !== 'lobby' && game.status !== 'in-progress') {
      console.log(`Game ${pin} status is ${game.status}, cannot start`);
      return;
    }

    if (game.status === 'lobby') {
      game.status = 'in-progress';
      await game.save();
      console.log(`Game ${pin} status updated to in-progress`);
    } else {
      console.log(`Game ${pin} already in-progress, proceeding with broadcast`);
    }

    // Broadcast game start to all players immediately
    if (this.io) {
      console.log(`Broadcasting game start to room ${pin} with ${this.io.sockets.adapter.rooms.get(pin)?.size || 0} clients`);
      this.io.to(pin).emit('game-state-update', {
        game: game.toObject(),
        view: 'question'
      });
      console.log('Game state broadcasted');
    } else {
      console.log('No io instance available for broadcast');
    }

    // Start the first question immediately
    await this.startQuestion(pin);
  }

  async startQuestion(pin: string) {
    console.log(`Starting question for game: ${pin}`);
    await connectToDatabase();
    
    // Ensure game is in the correct state
    const game = await Game.findOneAndUpdate(
      { pin, status: 'in-progress' },
      { $set: { questionStartTime: new Date() } },
      { new: true }
    ).populate('players').populate('questions');
    
    if (!game) {
      console.log(`Cannot start question: Game ${pin} not found or wrong status`);
      return;
    }

    // Clear any existing timers for this game
    if (this.timerIntervals.has(pin)) {
      clearInterval(this.timerIntervals.get(pin)!);
      this.timerIntervals.delete(pin);
    }

    // Clear previous answers
    await Player.updateMany(
      { game: game._id },
      { $unset: { lastAnswer: 1, hasAnswered: 1 } }
    );

    if (this.io) {
      const clientCount = this.io.sockets.adapter.rooms.get(pin)?.size || 0;
      console.log(`Starting question ${game.currentQuestionIndex + 1} for game ${pin} with ${clientCount} clients`);
      
      // Emit the question view with updated game state
      this.io.to(pin).emit('game-state-update', {
        game: game.toObject(),
        view: 'question'
      });
      
      console.log('Question view broadcasted to all clients');
    }

    // Set up the timer for this question
    const startTime = Date.now();
    const endTime = startTime + ROUND_DURATION_MS;
    
    // Broadcast initial timer value
    let timeLeft = Math.ceil(ROUND_DURATION_MS / 1000);
    if (this.io) {
      this.io.to(pin).emit('timer-update', { timeLeft });
    }

    // Set up timer interval for countdown
    const timerInterval = setInterval(() => {
      const now = Date.now();
      timeLeft = Math.max(0, Math.ceil((endTime - now) / 1000));
      
      // Broadcast timer update
      if (this.io) {
        this.io.to(pin).emit('timer-update', { timeLeft });
      }
      
      // Check if time's up
      if (now >= endTime) {
        clearInterval(timerInterval);
        this.timerIntervals.delete(pin);
        
        // Process the round when time's up
        setTimeout(() => this.processRound(pin), 100);
      }
    }, 200);
    
    // Store the interval for cleanup
    this.timerIntervals.set(pin, timerInterval);
    
    console.log(`Timer started for game ${pin}, will end at ${new Date(endTime).toISOString()}`);
  }

  async processRound(pin: string) {
    if (this.processingRounds.has(pin)) {
      console.log(`Round already processing for ${pin}`);
      return;
    }
    
    this.processingRounds.add(pin);
    console.log(`Starting round processing for ${pin}`);
    
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game) {
      console.log(`Game not found for pin: ${pin}`);
      this.processingRounds.delete(pin);
      return;
    }

    // Update game status to processing to prevent race conditions
    await Game.updateOne(
      { pin },
      { $set: { status: 'processing' } }
    );

    const currentQuestion = game.questions[game.currentQuestionIndex];
    const survivors: string[] = [];
    const eliminated: string[] = [];
    const responseTimes: number[] = [];
    let fastestResponse: { playerName: string; time: number } | undefined;

    // Get all players who were active at the start of this round
    const allPlayers = await Player.find({ game: game._id });
    const playersActiveThisRound = allPlayers.filter(p => !p.wasEliminatedBeforeRound);
    
    console.log(`Processing ${playersActiveThisRound.length} players for question ${currentQuestion._id}`);
    console.log('--- Processing Round ---');
    console.log('Current Question ID:', currentQuestion._id.toString());
    
    for (const player of playersActiveThisRound) {
      // Skip players already eliminated in previous rounds
      if (player.isEliminated && !player.lastAnswer?.questionId?.equals(currentQuestion._id)) {
        continue;
      }
      
      console.log(`\nChecking player: ${player.name}`);
      console.log('Player lastAnswer:', JSON.stringify(player.lastAnswer, null, 2));
      
      const hasAnswered = player.lastAnswer?.questionId?.toString() === currentQuestion._id.toString();
      const answeredCorrectly = hasAnswered && player.lastAnswer?.isCorrect === true;
      
      console.log(`Player: ${player.name}, Has Answered: ${hasAnswered}, Is Correct: ${player.lastAnswer?.isCorrect}, Answered Correctly: ${answeredCorrectly}`);

      if (answeredCorrectly) {
        survivors.push(player.name);
        if (player.lastAnswer?.responseTime) {
          responseTimes.push(player.lastAnswer.responseTime);
          if (!fastestResponse || player.lastAnswer.responseTime < fastestResponse.time) {
            fastestResponse = { playerName: player.name, time: player.lastAnswer.responseTime };
          }
        }
      } else {
        eliminated.push(player.name);
        if (!player.isEliminated) {
          await Player.updateOne({ _id: player._id }, { $set: { isEliminated: true } });
          
          // Different messages for no answer vs wrong answer
          const eliminationReason = hasAnswered ? 'wrong answer' : 'no answer';
          console.log(`Broadcasting elimination for: ${player.name} (${eliminationReason})`);
          this.broadcastElimination(pin, player.name, eliminationReason);
        }
      }
    }
    
    console.log(`\nRound processed: Survivors - [${survivors.join(', ')}], Eliminated - [${eliminated.join(', ')}]`);

    // Calculate average response time
    const averageResponseTime = responseTimes.length > 0 
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : undefined;

    // Save round history with analytics
    await Game.updateOne(
      { pin },
      {
        $push: {
          roundHistory: {
            roundNumber: game.currentQuestionIndex + 1,
            questionId: currentQuestion._id,
            questionText: currentQuestion.text,
            survivors,
            eliminated,
            averageResponseTime,
            fastestResponse
          }
        }
      }
    );

    // Show next question modal with results
    if (this.io) {
      this.io.to(pin).emit('game-state-update', {
        roundResults: { survivors, eliminated, averageResponseTime, fastestResponse }
      });
      console.log('Broadcasted results for next question modal:', pin);
    }
    
    // Clean up processing flag
    this.processingRounds.delete(pin);

    // Move to next question after modal duration
    setTimeout(async () => {
      try {
        console.log(`[${new Date().toISOString()}] Moving to next question after modal`);
        await this.nextQuestion(pin);
      } catch (error) {
        console.error('Error in nextQuestion:', error);
      }
    }, 4000);
  }

  async nextQuestion(pin: string) {
    console.log(`[${new Date().toISOString()}] nextQuestion called for game: ${pin}`);
    await connectToDatabase();
    
    // First, get the current game state
    const game = await Game.findOne({ pin })
      .populate('players')
      .populate('questions');

    if (!game) {
      console.log(`Game not found: ${pin}`);
      return;
    }

    // Check if the game is already finished
    if (game.status === 'finished') {
      console.log(`Game ${pin} is already finished`);
      return;
    }

    // Get fresh player data to check elimination status
    const freshPlayers = await Player.find({ game: game._id });
    const activePlayers = freshPlayers.filter(p => !p.isEliminated);
    const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;
    
    console.log(`Active players: ${activePlayers.length}, Current question index: ${game.currentQuestionIndex}, Total questions: ${game.questions.length}, Is last question: ${isLastQuestion}`);

    if (activePlayers.length <= 1 || isLastQuestion) {
      // Update game status to finished
      await Game.updateOne(
        { _id: game._id },
        { $set: { status: 'finished' } }
      );
      
      const allPlayers = await Player.find({ game: game._id }).sort({ score: -1 });
      const winners = allPlayers.map(p => ({
        _id: p._id,
        name: p.name,
        score: p.score || 0,
        isEliminated: p.isEliminated || false
      }));

      if (this.io) {
        console.log(`[${new Date().toISOString()}] Game finished. Winners:`, winners);
        this.io.to(pin).emit('game-state-update', {
          view: 'finished',
          winners
        });
      }
      
      // Clean up game resources for finished game
      if (this.timerIntervals.has(pin)) {
        clearInterval(this.timerIntervals.get(pin)!);
        this.timerIntervals.delete(pin);
      }
      console.log(`Game finished. Winners: ${winners.map(w => w.name).join(', ')}`);
    } else {
      // Move to next question
      const nextQuestionIndex = game.currentQuestionIndex + 1;
      const newPrizePool = game.prizePool + (game.incrementAmount || 0);
      
      console.log(`Moving to question ${nextQuestionIndex + 1} (index ${nextQuestionIndex})`);
      
      // Update game state for next question
      const updatedGame = await Game.findOneAndUpdate(
        { _id: game._id },
        { 
          $set: { 
            currentQuestionIndex: nextQuestionIndex,
            prizePool: newPrizePool,
            questionStartTime: new Date(),
            status: 'in-progress'
          }
        },
        { new: true }
      ).populate('players').populate('questions');
      
      if (!updatedGame) {
        console.log(`Failed to update game for next question`);
        return;
      }
      
      // Clear previous answers before starting next question
      await Player.updateMany(
        { game: updatedGame._id },
        { $unset: { lastAnswer: 1, hasAnswered: 1 } }
      );
      
      console.log(`[${new Date().toISOString()}] Starting question ${nextQuestionIndex + 1} for game ${pin}`);
      
      // Clear any existing timers before starting next question
      if (this.timerIntervals.has(pin)) {
        clearInterval(this.timerIntervals.get(pin)!);
        this.timerIntervals.delete(pin);
      }
      
      // Start the next question
      await this.startQuestion(pin);
    }
  }

  broadcastElimination(pin: string, playerName: string, reason: string = 'eliminated') {
    if (this.io) {
      this.io.to(pin).emit('player-eliminated', { playerName, reason });
    }
  }

  broadcastWrongAnswer(pin: string, playerName: string) {
    if (this.io) {
      this.io.to(pin).emit('wrong-answer', { playerName });
    }
  }

  broadcastLiveStats(pin: string, stats: { playersAnswered: number; correctAnswers: number; averageTime: number; fastestPlayer?: { name: string; time: number } }) {
    if (this.io) {
      this.io.to(pin).emit('live-stats', stats);
    }
  }

  async broadcastCurrentStats(pin: string) {
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game) return;

    const currentQuestion = game.questions[game.currentQuestionIndex];
    const activePlayers = await Player.find({ game: game._id, isEliminated: false });
    
    const playersAnswered = activePlayers.filter(p => 
      p.lastAnswer?.questionId?.toString() === currentQuestion._id.toString()
    ).length;
    
    const correctAnswers = activePlayers.filter(p => 
      p.lastAnswer?.questionId?.toString() === currentQuestion._id.toString() && 
      p.lastAnswer?.isCorrect === true
    ).length;

    const responseTimes = activePlayers
      .filter(p => p.lastAnswer?.responseTime)
      .map(p => p.lastAnswer!.responseTime!);
    
    const averageTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    const fastestPlayer = activePlayers
      .filter(p => p.lastAnswer?.responseTime)
      .sort((a, b) => (a.lastAnswer?.responseTime || 0) - (b.lastAnswer?.responseTime || 0))[0];

    const stats = {
      playersAnswered,
      correctAnswers,
      averageTime: Math.round(averageTime),
      fastestPlayer: fastestPlayer ? {
        name: fastestPlayer.name,
        time: fastestPlayer.lastAnswer?.responseTime || 0
      } : undefined
    };

    this.broadcastLiveStats(pin, stats);
  }

  async handlePlayerAnswer(pin: string, playerId: string, answer: string) {
    if (!validatePin(pin) || !validatePlayerId(playerId) || !validateAnswer(answer)) {
      console.log('Invalid input parameters');
      return;
    }
    try {
      await connectToDatabase();
      
      const game = await Game.findOne({ 
        pin, 
        status: 'in-progress' 
      }).populate('questions');
      
      if (!game) {
        console.log(`Cannot process answer: game ${pin} not found or not in progress`);
        return;
      }

      const currentQuestion = game.questions[game.currentQuestionIndex] as { _id: string; correctAnswer: string };
      if (!currentQuestion) {
        console.log(`No current question for game ${pin}`);
        return;
      }

      // Find the player
      const player = await Player.findOne({ _id: playerId });
      
      if (!player) {
        console.log(`Player ${playerId} not found`);
        return;
      }
      
      // Check if they've already answered this question
      if (player.lastAnswer?.questionId?.toString() === currentQuestion._id.toString()) {
        console.log(`Player ${playerId} already answered this question`);
        return;
      }
      
      const isCorrect = currentQuestion.correctAnswer === answer;
      const responseTime = Date.now() - new Date(game.questionStartTime || 0).getTime();
      
      console.log(`Answer from ${sanitizeForLog(player.name)}: ${sanitizeForLog(answer)}, correct: ${isCorrect}, response time: ${responseTime}ms`);

      // Prepare the update query
      const updateQuery: { $set: { lastAnswer: { questionId: string; isCorrect: boolean; submittedAt: Date; responseTime: number }; hasAnswered: boolean }; $inc?: { score: number } } = {
        $set: { 
          lastAnswer: { 
            questionId: currentQuestion._id, 
            isCorrect, 
            submittedAt: new Date(),
            responseTime
          },
          hasAnswered: true
        }
      };

      // Update score if correct
      if (isCorrect) {
        updateQuery.$inc = { score: 100 };
      }

      // Update the player's answer and score
      const updatedPlayer = await Player.findOneAndUpdate(
        { _id: playerId },
        updateQuery,
        { new: true }
      );
      
      if (!updatedPlayer) {
        console.log(`Failed to update player ${playerId}`);
        return;
      }
      
      // Send confirmation to the player
      if (this.io) {
        this.io.to(pin).emit('answer-confirmed', { 
          playerId, 
          isCorrect,
          score: updatedPlayer.score || 0
        });
      }
      
      // Check if all active players have answered
      const totalActivePlayers = await Player.countDocuments({ 
        game: game._id, 
        isEliminated: false 
      });
      
      const answeredCount = await Player.countDocuments({
        game: game._id,
        isEliminated: false,
        'lastAnswer.questionId': currentQuestion._id
      });
      
      console.log(`Answer stats: ${answeredCount}/${totalActivePlayers} active players answered`);
      
      // Broadcast answer progress
      if (this.io) {
        this.io.to(pin).emit('answer-progress', { 
          answered: answeredCount, 
          total: totalActivePlayers 
        });
      }
      
      // If all active players have answered, process the round
      if (totalActivePlayers > 0 && answeredCount >= totalActivePlayers) {
        console.log('All active players have answered, processing round');
        // Clear timer since all players answered
        if (this.timerIntervals.has(pin)) {
          clearInterval(this.timerIntervals.get(pin)!);
          this.timerIntervals.delete(pin);
        }
        setTimeout(() => this.processRound(pin), 100);
      }
    } catch (error) {
      console.error('Error in handlePlayerAnswer:', error);
      // Notify player of error
      if (this.io) {
        this.io.to(pin).emit('answer-error', { playerId, message: 'Failed to submit answer' });
      }
    }
  }
}

export const gameController = new GameController();