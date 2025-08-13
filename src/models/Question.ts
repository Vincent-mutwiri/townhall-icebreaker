// src/models/Question.ts
import pkg from 'mongoose';
const { Schema, model, models } = pkg;

export interface IQuestion extends Document {
  text: string;
  options: string[];
  correctAnswer: string;
}

const QuestionSchema = new Schema({
  text: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
});

// This prevents Mongoose from compiling the model multiple times in development
export const Question = models.Question || model<IQuestion>('Question', QuestionSchema);