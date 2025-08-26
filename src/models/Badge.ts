// src/models/Badge.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: {
    type: 'games_won' | 'games_played' | 'questions_answered' | 'streak' | 'special';
    value?: number;
    description: string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    maxlength: [50, 'Badge name cannot exceed 50 characters']
  },
  description: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: [200, 'Badge description cannot exceed 200 characters']
  },
  icon: { 
    type: String, 
    required: true,
    default: '🏆'
  },
  color: { 
    type: String, 
    required: true,
    default: '#FFD700',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color']
  },
  criteria: {
    type: {
      type: String,
      enum: ['games_won', 'games_played', 'questions_answered', 'streak', 'special'],
      required: true
    },
    value: {
      type: Number,
      min: [1, 'Criteria value must be at least 1']
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Criteria description cannot exceed 100 characters']
    }
  },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'], 
    default: 'common' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

// Index for efficient queries
BadgeSchema.index({ rarity: 1, isActive: 1 });
BadgeSchema.index({ 'criteria.type': 1, 'criteria.value': 1 });

export const Badge = models.Badge || model<IBadge>('Badge', BadgeSchema);
