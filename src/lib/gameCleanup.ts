import connectToDatabase from './database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';

export async function cleanupOldGames() {
  try {
    await connectToDatabase();
    
    // Delete games older than 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const oldGames = await Game.find({ 
      createdAt: { $lt: cutoffTime } 
    });
    
    for (const game of oldGames) {
      // Delete associated players
      await Player.deleteMany({ game: game._id });
      // Delete the game
      await Game.deleteOne({ _id: game._id });
    }
    
    console.log(`Cleaned up ${oldGames.length} old games`);
  } catch (error) {
    console.error('Error cleaning up old games:', error);
  }
}

// Run cleanup every hour
setInterval(cleanupOldGames, 60 * 60 * 1000);