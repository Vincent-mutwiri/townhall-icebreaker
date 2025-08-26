import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/database';
import { Game } from '@/models/Game';
import { Player } from '@/models/Player';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { pin } = await request.json();

    const game = await Game.findOne({ pin }).populate('players');
    if (!game) {
      return NextResponse.json({ message: 'Game not found.' }, { status: 404 });
    }

    // Move to next question or end game
    const nextQuestionIndex = game.currentQuestionIndex + 1;
    if (nextQuestionIndex < game.questions.length) {
      game.currentQuestionIndex = nextQuestionIndex;
      await game.save();
      
      // Clear lastAnswer for all players when moving to next round
      await Player.updateMany({ game: game._id }, { $unset: { lastAnswer: 1 } });
      
      const updatedGame = await Game.findById(game._id).populate('questions').populate('players');
      return NextResponse.json({ 
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
        gameEnded: true,
        winners
      });
    }

  } catch (error) {
    console.error('Error processing round:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}