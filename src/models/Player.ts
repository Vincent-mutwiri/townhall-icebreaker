// src/models/Player.ts
import { Schema, model, models, Document } from 'mongoose';

export interface IPlayer extends Document {
  name: string;
  game: Schema.Types.ObjectId;
  score: number;
  isEliminated: boolean;
}

const PlayerSchema = new Schema({
  name: { type: String, required: true },
  // A reference to the game this player belongs to
  game: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  score: { type: Number, default: 0 },
  isEliminated: { type: Boolean, default: false },
});

export const Player = models.Player || model<IPlayer>('Player', PlayerSchema);