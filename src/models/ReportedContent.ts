// src/models/ReportedContent.ts
import mongoose from 'mongoose';

const ReportedContentSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'contentType'
  },
  contentType: {
    type: String,
    required: true,
    enum: ['UpdatePost', 'Course', 'GameTemplate']
  },
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'harassment',
      'inappropriate_content',
      'misinformation',
      'copyright_violation',
      'other'
    ]
  },
  description: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Index for efficient queries
ReportedContentSchema.index({ status: 1, createdAt: -1 });
ReportedContentSchema.index({ contentId: 1, contentType: 1 });
ReportedContentSchema.index({ reporterId: 1, createdAt: -1 });

export const ReportedContent = mongoose.models.ReportedContent || mongoose.model('ReportedContent', ReportedContentSchema);
