// src/models/Result.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

export interface IResult extends Document {
  userId: pkg.Schema.Types.ObjectId;
  source: 'course' | 'game';
  sourceId: pkg.Schema.Types.ObjectId; // Refers to Course or HostedGame
  score: number;
  pointsAwarded: number;
  details: any; // e.g., quiz answers, game placement
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema({
  userId: { 
    type: pkg.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  source: { 
    type: String, 
    enum: ['course', 'game'], 
    required: true 
  },
  sourceId: { 
    type: pkg.Schema.Types.ObjectId, 
    required: true 
  }, // Refers to Course or HostedGame
  score: { 
    type: Number, 
    default: 0 
  },
  pointsAwarded: { 
    type: Number, 
    required: true 
  },
  details: { 
    type: pkg.Schema.Types.Mixed 
  }, // e.g., quiz answers, game placement
}, { 
  timestamps: true 
});

export const Result = models.Result || model<IResult>('Result', ResultSchema);
