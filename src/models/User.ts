// src/models/User.ts
import pkg from 'mongoose';
import bcrypt from 'bcryptjs';
const { Schema, model, models, Document } = pkg;

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: 'teacher' | 'admin';
  avatar?: string;
  points: number;
  level: number;
  badges: {
    badgeId: pkg.Schema.Types.ObjectId;
    awardedAt: Date;
  }[];
  stats: {
    coursesTaken: number;
    gamesCreated: number;
    gamesHosted: number;
    gamesPlayed: number;
    gamesWon: number;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['teacher', 'admin'],
    default: 'teacher'
  },
  avatar: {
    type: String
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  badges: [{
    badgeId: { type: pkg.Schema.Types.ObjectId, ref: 'Badge' },
    awardedAt: { type: Date, default: Date.now },
  }],
  stats: {
    coursesTaken: { type: Number, default: 0 },
    gamesCreated: { type: Number, default: 0 },
    gamesHosted: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
  },
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 10
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent password from being returned in JSON
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export const User = models.User || model<IUser>('User', UserSchema);
