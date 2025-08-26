// src/models/Badge.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

export interface IBadge extends Document {
  name: string;
  icon: string; // S3 URL
  rule: any; // e.g., { type: 'points', threshold: 1000 }
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  }, // S3 URL
  rule: {
    type: pkg.Schema.Types.Mixed,
    required: true
  }, // e.g., { type: 'points', threshold: 1000 }
}, {
  timestamps: true
});

export const Badge = models.Badge || model<IBadge>('Badge', BadgeSchema);
