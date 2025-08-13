import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';
import { Vote } from '@/models/Vote';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { pin, eliminatedPlayers } = await request.json();

    const game = await Game.findOne({ pin }).populate('players');
    if (!game) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    // Count votes for each eliminated player
    const currentRound = game.currentQuestionIndex + 1;
    const votes = await Vote.find({ game: game._id, round: currentRound });
    
    const voteCount: { [key: string]: number } = {};
    votes.forEach(vote => {
      const playerId = vote.votedForPlayer.toString();
      voteCount[playerId] = (voteCount[playerId] || 0) + 1;
    });
    
    // Find player with most votes
    let redeemedPlayer = null;
    let maxVotes = 0;
    let playerToRedeem = null;
    
    eliminatedPlayers.forEach((player: any) => {
      const votes = voteCount[player._id] || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        playerToRedeem = player;
      }
    });
    
    if (playerToRedeem && maxVotes > 0) {
      await Player.updateOne({ _id: playerToRedeem._id }, { $set: { isEliminated: false } });
      redeemedPlayer = playerToRedeem.name;
      await game.populate('players');
    }

    // Move to next question or end game
    const nextQuestionIndex = game.currentQuestionIndex + 1;
    if (nextQuestionIndex < game.questions.length) {
      game.currentQuestionIndex = nextQuestionIndex;
      game.lastRedemption = redeemedPlayer;
      await game.save();
      
        // Clear lastAnswer for all players when moving to next round
      await Player.updateMany({ game: game._id }, { $unset: { lastAnswer: 1 } });
      
      const updatedGame = await Game.findById(game._id).populate('questions').populate('players');
      return NextResponse.json({ 
        redeemedPlayer, 
        nextRound: true,
        game: JSON.parse(JSON.stringify(updatedGame))
      });
    } else {
      // Game is over - calculate winners
      game.status = 'finished';
      await game.save();
      
      const allPlayers = await Player.find({ game: game._id }).sort({ score: -1 });
      const winners = allPlayers.map(p => ({
        _id: p._id,
        name: p.name,
        score: p.score || 0
      }));
      
      return NextResponse.json({ 
        redeemedPlayer, 
        gameEnded: true,
        winners
      });
    }

  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}