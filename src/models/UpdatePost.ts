// src/models/UpdatePost.ts
import pkg from 'mongoose';
const { Schema, model, models, Document } = pkg;

export interface IUpdatePost extends Document {
  authorId: pkg.Schema.Types.ObjectId;
  text: string;
  media: string[]; // Array of S3 URLs
  tags: string[];
  upvotes: pkg.Schema.Types.ObjectId[];
  upvoteCount: number;
  isPublic: boolean;
  isPinned: boolean;
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
    required: true,
    maxlength: 1000
  },
  media: [{
    type: String
  }], // Array of S3 URLs
  tags: [{
    type: String,
    maxlength: 50
  }],
  upvotes: [{
    type: pkg.Schema.Types.ObjectId,
    ref: 'User'
  }],
  upvoteCount: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
UpdatePostSchema.index({ createdAt: -1 });
UpdatePostSchema.index({ authorId: 1, createdAt: -1 });
UpdatePostSchema.index({ upvoteCount: -1, createdAt: -1 });

// Update upvote count when upvotes array changes
UpdatePostSchema.pre('save', function(next) {
  if (this.isModified('upvotes')) {
    this.upvoteCount = this.upvotes.length;
  }
  next();
});

export const UpdatePost = models.UpdatePost || model<IUpdatePost>('UpdatePost', UpdatePostSchema);
