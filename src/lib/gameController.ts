// src/lib/gameController.ts
import { Server } from 'socket.io';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';
import connectToDatabase from '@/lib/database';

const ROUND_DURATION_MS = 15000;
const RESULTS_DURATION_MS = 5000;

class GameController {
  private io: Server | null = null;

  setIO(io: Server) {
    this.io = io;
  }

  async startGame(pin: string) {
    console.log(`GameController.startGame called for pin: ${pin}`);
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
        game: JSON.parse(JSON.stringify(game)),
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
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game || game.status !== 'in-progress') return;

    await Player.updateMany({ game: game._id }, { $unset: { lastAnswer: 1 } });

    if (this.io) {
      console.log(`Started question ${game.currentQuestionIndex + 1} for game ${pin} with ${this.io.sockets.adapter.rooms.get(pin)?.size || 0} clients`);
      this.io.to(pin).emit('game-state-update', {
        game: JSON.parse(JSON.stringify(game)),
        view: 'question'
      });
      console.log('Question broadcasted to all clients');
    }

    setTimeout(async () => {
      await this.processRound(pin);
    }, ROUND_DURATION_MS);
  }

  async processRound(pin: string) {
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game || game.status !== 'in-progress') return;

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

    if (this.io) {
      this.io.to(pin).emit('game-state-update', {
        view: 'results',
        roundResults: { survivors, eliminated }
      });
    }

    setTimeout(async () => {
      await this.nextQuestion(pin);
    }, RESULTS_DURATION_MS);
  }

  async nextQuestion(pin: string) {
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game || game.status !== 'in-progress') return;

    // Get fresh player data to check elimination status
    const freshPlayers = await Player.find({ game: game._id });
    const activePlayers = freshPlayers.filter(p => !p.isEliminated);
    const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

    if (activePlayers.length <= 1 || isLastQuestion) {
      game.status = 'finished';
      await game.save();
      
      const allPlayers = await Player.find({ game: game._id }).sort({ score: -1 });
      const winners = allPlayers.map(p => ({
        _id: p._id,
        name: p.name,
        score: p.score || 0
      }));

      if (this.io) {
        this.io.to(pin).emit('game-state-update', {
          view: 'finished',
          winners
        });
      }
    } else {
      game.currentQuestionIndex += 1;
      game.prizePool += game.incrementAmount;
      await game.save();
      
      // Clear previous answers before starting next question
      await Player.updateMany({ game: game._id }, { $unset: { lastAnswer: 1 } });
      
      await this.startQuestion(pin);
    }
  }

  broadcastElimination(pin: string, playerName: string) {
    if (this.io) {
      this.io.to(pin).emit('player-eliminated', { playerName });
    }
  }

  async playerAnswered(pin: string, playerId: string) {
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game) return;

    const player = game.players.find((p: {id: string}) => p.id === playerId);
    if (!player) return;

    player.hasAnswered = true;
    await player.save();

    // Check if all active players have answered
    const allActivePlayers = game.players.filter((p: {isEliminated: boolean}) => !p.isEliminated); // Use isEliminated from DB
    const allAnswered = allActivePlayers.every((p: {hasAnswered: boolean}) => p.hasAnswered);

    if (allAnswered) {
      game.status = 'answers-submitted'; // Update game status
      await game.save();
      this.processRound(pin); // Trigger round processing immediately
    }

    // Broadcast updated game state to all players in the room
    if (this.io) {
      this.io.to(pin).emit('game-state-update', {
        game: JSON.parse(JSON.stringify(game)),
        view: 'question' // Or whatever view is appropriate after an answer
      });
    }
  }
}

export const gameController = new GameController();