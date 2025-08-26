// src/models/HostedGame.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

export interface IPlayer {
  userId: pkg.Schema.Types.ObjectId;
  joinedAt: Date;
}

export interface IGameResult {
  userId: pkg.Schema.Types.ObjectId;
  score: number;
  points: number;
  details: any; // Game-specific result details
}

export interface IHostedGame extends Document {
  templateId: pkg.Schema.Types.ObjectId;
  hostId: pkg.Schema.Types.ObjectId;
  status: 'scheduled' | 'live' | 'finished';
  startAt: Date;
  joinCode: string;
  players: IPlayer[];
  results: IGameResult[];
  createdAt: Date;
  updatedAt: Date;
}

const HostedGameSchema = new Schema({
  templateId: { 
    type: pkg.Schema.Types.ObjectId, 
    ref: 'GameTemplate', 
    required: true 
  },
  hostId: { 
    type: pkg.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'finished'], 
    default: 'scheduled' 
  },
  startAt: { 
    type: Date, 
    default: Date.now 
  },
  joinCode: { 
    type: String, 
    required: true, 
    unique: true 
  },
  players: [{
    userId: { 
      type: pkg.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    joinedAt: { 
      type: Date, 
      default: Date.now 
    },
  }],
  results: [{
    userId: { 
      type: pkg.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    score: Number,
    points: Number,
    details: pkg.Schema.Types.Mixed,
  }],
}, { 
  timestamps: true 
});

export const HostedGame = models.HostedGame || model<IHostedGame>('HostedGame', HostedGameSchema);
