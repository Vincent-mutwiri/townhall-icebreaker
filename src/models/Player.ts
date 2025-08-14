// src/models/Player.ts
import pkg from 'mongoose';
const { Schema, model, models } = pkg;

export interface IPlayer extends Document {
  name: string;
  game: pkg.Schema.Types.ObjectId;
  score: number;
  isEliminated: boolean;
  lastAnswer?: {
    questionId: pkg.Schema.Types.ObjectId;
    isCorrect: boolean;
    submittedAt: Date;
  };
  hasAnswered?: boolean;
}

const PlayerSchema = new Schema({
  name: { type: String, required: true },
  // A reference to the game this player belongs to
  game: { type: pkg.Schema.Types.ObjectId, ref: 'Game', required: true },
  score: { type: Number, default: 0 },
  isEliminated: { type: Boolean, default: false },
  hasAnswered: { type: Boolean, default: false },
  lastAnswer: { type: Object, _id: false },
});

export const Player = models.Player || model<IPlayer>('Player', PlayerSchema);