// src/models/Game.ts
import pkg from 'mongoose';
const { Schema, model, models } = pkg;
import './Player.ts'; // Ensure Player model is registered
import './Question.ts'; // Ensure Question model is registered

export interface IGame extends Document {
  pin: string;
  host: string;
  hostName: string;
  status: 'lobby' | 'in-progress' | 'voting' | 'finished';
  initialPrize: number;
  incrementAmount: number;
  prizePool: number;
  questions: pkg.Schema.Types.ObjectId[];
  players: pkg.Schema.Types.ObjectId[];
  eliminatedPlayers: pkg.Schema.Types.ObjectId[];
  currentQuestionIndex: number;
  questionStartTime?: Date;
  roundHistory: Array<{
    roundNumber: number;
    questionId: pkg.Schema.Types.ObjectId;
    questionText: string;
    survivors: string[];
    eliminated: string[];
    averageResponseTime?: number;
    fastestResponse?: { playerName: string; time: number };
  }>;
}

const GameSchema = new Schema({
  pin: { type: String, required: true, unique: true, index: true },
  host: { type: String, required: false },
  hostName: { type: String, required: false },
  status: {
    type: String,
    enum: ['lobby', 'in-progress', 'voting', 'finished'],
    default: 'lobby',
  },
  initialPrize: { type: Number, required: true },
  incrementAmount: { type: Number, required: true },
  prizePool: { type: Number, required: true },
  // An array of references to Question documents
  questions: [{ type: pkg.Schema.Types.ObjectId, ref: 'Question' }],
  // An array of references to Player documents
  players: [{ type: pkg.Schema.Types.ObjectId, ref: 'Player' }],
  eliminatedPlayers: [{ type: pkg.Schema.Types.ObjectId, ref: 'Player' }],
  currentQuestionIndex: { type: Number, default: 0 },
  lastRedemption: { type: String, default: null },
  questionStartTime: { type: Date },
  roundHistory: [{
    roundNumber: { type: Number, required: true },
    questionId: { type: pkg.Schema.Types.ObjectId, ref: 'Question', required: true },
    questionText: { type: String, required: true },
    survivors: [{ type: String }],
    eliminated: [{ type: String }],
    averageResponseTime: { type: Number },
    fastestResponse: {
      playerName: { type: String },
      time: { type: Number }
    }
  }],
}, { 
  timestamps: true, // Adds createdAt and updatedAt timestamps
  // Ensure the model uses the existing collection but with our new schema
  collection: 'games',
  // Skip validation of existing documents
  strict: false
});

export const Game = models.Game || model<IGame>('Game', GameSchema);