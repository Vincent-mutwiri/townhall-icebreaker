// src/models/Badge.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

export interface IBadge extends Document {
  name: string;
  description: string;
  icon: string; // Icon name or S3 URL
  color: string;
  category: string;
  rule: any; // e.g., { type: 'points', threshold: 1000 }
  rarity: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true,
    default: 'Trophy'
  }, // Icon name or S3 URL
  color: {
    type: String,
    required: true,
    default: 'yellow'
  },
  category: {
    type: String,
    enum: ['achievement', 'milestone', 'special', 'course', 'game'],
    default: 'achievement'
  },
  rule: {
    type: pkg.Schema.Types.Mixed,
    required: true
  }, // e.g., { type: 'points', threshold: 1000 }
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
BadgeSchema.index({ category: 1, isActive: 1 });
BadgeSchema.index({ rarity: 1, order: 1 });

export const Badge = models.Badge || model<IBadge>('Badge', BadgeSchema);
