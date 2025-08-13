// src/models/Game.ts
import { Schema, model, models, Document } from 'mongoose';

export interface IGame extends Document {
  pin: string;
  status: 'lobby' | 'in-progress' | 'voting' | 'finished';
  initialPrize: number;
  incrementAmount: number;
  prizePool: number;
  questions: Schema.Types.ObjectId[];
  players: Schema.Types.ObjectId[];
  eliminatedPlayers: Schema.Types.ObjectId[];
  currentQuestionIndex: number;
}

const GameSchema = new Schema({
  pin: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ['lobby', 'in-progress', 'voting', 'finished'],
    default: 'lobby',
  },
  initialPrize: { type: Number, required: true },
  incrementAmount: { type: Number, required: true },
  prizePool: { type: Number, required: true },
  // An array of references to Question documents
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
  // An array of references to Player documents
  players: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  eliminatedPlayers: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  currentQuestionIndex: { type: Number, default: 0 },
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

export const Game = models.Game || model<IGame>('Game', GameSchema);