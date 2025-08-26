// src/models/Progress.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

export interface IProgress extends Document {
  userId: pkg.Schema.Types.ObjectId;
  courseId: pkg.Schema.Types.ObjectId;
  completedModules: pkg.Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgressSchema = new Schema({
  userId: { 
    type: pkg.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: pkg.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  completedModules: [{ 
    type: pkg.Schema.Types.ObjectId 
  }],
}, {
  timestamps: true,
});

// Create a compound index to ensure a user has only one progress document per course
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Progress = models.Progress || model<IProgress>('Progress', ProgressSchema);
