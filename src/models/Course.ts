// src/models/Course.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

// Define the Module structure first
const ModuleSchema = new Schema({
  type: { 
    type: String, 
    enum: ['text', 'image', 'quiz', 'video', 'assignment'], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  content: { 
    type: pkg.Schema.Types.Mixed, 
    required: true 
  }, // Flexible content (text, URL, quiz object)
  lockRules: {
    minPoints: { type: Number },
    requireModules: [{ type: pkg.Schema.Types.ObjectId }],
  },
});

export interface IModule {
  type: 'text' | 'image' | 'quiz' | 'video' | 'assignment';
  title: string;
  content: any; // Flexible content structure
  lockRules?: {
    minPoints?: number;
    requireModules?: pkg.Schema.Types.ObjectId[];
  };
}

export interface ICourse extends Document {
  title: string;
  description: string;
  cover?: string;
  modules: IModule[];
  requirements: {
    minPoints?: number;
  };
  status: 'draft' | 'published';
  createdBy: pkg.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  cover: { 
    type: String 
  },
  modules: [ModuleSchema], // Embed the Module schema here
  requirements: {
    minPoints: { type: Number },
  },
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  createdBy: { 
    type: pkg.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
}, { 
  timestamps: true 
});

export const Course = models.Course || model<ICourse>('Course', CourseSchema);
