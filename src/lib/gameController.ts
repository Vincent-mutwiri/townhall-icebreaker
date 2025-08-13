// Server-side game state controller
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';
import { Vote } from '@/models/Vote';
import connectToDatabase from '@/lib/database';

class GameController {
  private gameStates: Map<string, any> = new Map();

  async startQuestion(pin: string) {
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game) return;

    // Broadcast question start
    this.broadcastGameState(pin, {
      type: 'SYNC_STATE',
      game: JSON.parse(JSON.stringify(game)),
      view: 'question'
    });

    // Auto-process after 15 seconds
    setTimeout(() => {
      this.processRound(pin);
    }, 15000);
  }

  async processRound(pin: string) {
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game) return;

    const currentQuestion = game.questions[game.currentQuestionIndex];
    const survivors: string[] = [];
    const eliminated: string[] = [];

    // Process all players
    for (const player of game.players) {
      const answeredCorrectly = player.lastAnswer?.questionId?.toString() === currentQuestion._id.toString() && player.lastAnswer.isCorrect;

      if (answeredCorrectly) {
        survivors.push(player.name);
      } else {
        eliminated.push(player.name);
        if (!player.isEliminated) {
          await Player.updateOne({ _id: player._id }, { $set: { isEliminated: true } });
        }
      }
    }

    // Broadcast results
    this.broadcastGameState(pin, {
      type: 'SYNC_STATE',
      view: 'results',
      roundResults: { survivors, eliminated }
    });

    // Auto-progress to next question after 5 seconds
    setTimeout(() => {
      this.nextQuestion(pin);
    }, 5000);
  }



  async nextQuestion(pin: string) {
    await connectToDatabase();
    const game = await Game.findOne({ pin }).populate('players').populate('questions');
    if (!game) return;

    // Clear answers for next round
    await Player.updateMany({ game: game._id }, { $unset: { lastAnswer: 1 } });

    // Check if game should end
    const activePlayers = game.players.filter(p => !p.isEliminated);
    if (activePlayers.length <= 1 || game.currentQuestionIndex + 1 >= game.questions.length) {
      // Game over
      const allPlayers = await Player.find({ game: game._id }).sort({ score: -1 });
      const winners = allPlayers.map(p => ({ _id: p._id, name: p.name, score: p.score || 0 }));
      
      this.broadcastGameState(pin, {
        type: 'SYNC_STATE',
        view: 'finished',
        winners
      });
      
      game.status = 'finished';
      await game.save();
      return;
    }

    // Move to next question and increase prize pool
    game.currentQuestionIndex += 1;
    game.prizePool += game.incrementAmount;
    await game.save();

    // Start next question
    this.startQuestion(pin);
  }

  private broadcastGameState(pin: string, data: any) {
    // Store the latest state with timestamp to prevent duplicates
    const timestampedData = { ...data, timestamp: Date.now() };
    this.gameStates.set(pin, timestampedData);
    
    console.log(`Broadcasting to ${pin}:`, data.type);
    
    // Clear the state after 1 second so it's only sent once
    setTimeout(() => {
      this.gameStates.delete(pin);
    }, 1000);
  }

  broadcastElimination(pin: string, playerName: string) {
    this.broadcastGameState(pin, {
      type: 'PLAYER_ELIMINATED',
      playerName
    });
  }

  getGameState(pin: string) {
    return this.gameStates.get(pin);
  }

  clearGameState(pin: string) {
    const timer = this.gameTimers.get(pin);
    if (timer) {
      clearTimeout(timer);
      this.gameTimers.delete(pin);
    }
    this.gameStates.delete(pin);
  }
}

export const gameController = new GameController();