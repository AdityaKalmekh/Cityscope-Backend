import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/user.types";
import bcrypt from 'bcryptjs';

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },

  city: {
    type: String
  },
  
  bio: {
    type: String,
    trim: true,
    maxlength: [160, 'Bio cannot exceed 160 characters'],
    default: ''
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  postsCount: {
    type: Number,
    default: 0,
    min: [0, 'Posts count cannot be negative']
  },
  
  isActive: {
    type: Boolean,
    default: true
  },

  userStatus: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1, isVerified: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to get full name
userSchema.methods.getFullName = function(): string {
  return `${this.firstName} ${this.lastName}`.trim();
};

// Instance method to increment posts count
userSchema.methods.incrementPostsCount = async function(): Promise<IUser> {
  this.postsCount += 1;
  return await this.save();
};

// Instance method to decrement posts count
userSchema.methods.decrementPostsCount = async function(): Promise<IUser> {
  if (this.postsCount > 0) {
    this.postsCount -= 1;
  }
  return await this.save();
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;