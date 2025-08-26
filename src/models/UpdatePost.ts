// src/models/UpdatePost.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

export interface IUpdatePost extends Document {
  authorId: pkg.Schema.Types.ObjectId;
  text: string;
  media: string[]; // Array of S3 URLs
  tags: string[];
  upvotes: pkg.Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UpdatePostSchema = new Schema({
  authorId: { 
    type: pkg.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  media: [{ 
    type: String 
  }], // Array of S3 URLs
  tags: [{ 
    type: String 
  }],
  upvotes: [{ 
    type: pkg.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
}, { 
  timestamps: true 
});

export const UpdatePost = models.UpdatePost || model<IUpdatePost>('UpdatePost', UpdatePostSchema);
