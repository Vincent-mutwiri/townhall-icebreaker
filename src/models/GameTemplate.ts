// src/models/GameTemplate.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

const GameRuleSchema = new Schema({
  basePoints: { 
    type: Number, 
    default: 100 
  },
  timeBonusMax: { 
    type: Number, 
    default: 50 
  },
  streakBonus: { 
    type: Number, 
    default: 20 
  },
  hintCost: { 
    type: Number, 
    default: 10 
  },
});

export interface IGameRules {
  basePoints: number;
  timeBonusMax: number;
  streakBonus: number;
  hintCost: number;
}

export interface IQuestion {
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
}

export interface IGameTemplate extends Document {
  title: string;
  mechanics: 'quiz' | 'puzzle' | 'flashcards';
  rules: IGameRules;
  questions: IQuestion[];
  createdBy: pkg.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GameTemplateSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  mechanics: { 
    type: String, 
    enum: ['quiz', 'puzzle', 'flashcards'], 
    default: 'quiz' 
  },
  rules: GameRuleSchema,
  questions: [{ 
    type: pkg.Schema.Types.Mixed 
  }], // Array of question objects
  createdBy: { 
    type: pkg.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
}, { 
  timestamps: true 
});

export const GameTemplate = models.GameTemplate || model<IGameTemplate>('GameTemplate', GameTemplateSchema);
