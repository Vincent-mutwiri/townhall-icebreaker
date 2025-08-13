import pkg from 'mongoose';
const { Schema, model, models } = pkg;

export interface IVote extends Document {
  game: pkg.Schema.Types.ObjectId;
  votedForPlayer: pkg.Schema.Types.ObjectId;
  round: number;
}

const VoteSchema = new Schema({
  game: { type: pkg.Schema.Types.ObjectId, ref: 'Game', required: true },
  votedForPlayer: { type: pkg.Schema.Types.ObjectId, ref: 'Player', required: true },
  round: { type: Number, required: true },
}, { timestamps: true });

export const Vote = models.Vote || model<IVote>('Vote', VoteSchema);