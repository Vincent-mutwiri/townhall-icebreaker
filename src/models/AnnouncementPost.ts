// src/models/AnnouncementPost.ts
import { Schema, model, models, Document } from 'mongoose';

export interface IAnnouncementPost extends Document {
  title: string;
  content: string;
  coverImage?: string; // S3 URL
  status: 'draft' | 'published';
  authorId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementPostSchema = new Schema({
  title: { 
    type: String, 
    required: true,
    maxlength: 200
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 2000
  },
  coverImage: { 
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Cover image must be a valid URL'
    }
  },
  status: { 
    type: String, 
    enum: ['draft', 'published'], 
    default: 'draft' 
  },
  authorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
AnnouncementPostSchema.index({ status: 1, createdAt: -1 });
AnnouncementPostSchema.index({ authorId: 1, createdAt: -1 });

// Virtual for formatted creation date
AnnouncementPostSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

export const AnnouncementPost = models.AnnouncementPost || model<IAnnouncementPost>('AnnouncementPost', AnnouncementPostSchema);
