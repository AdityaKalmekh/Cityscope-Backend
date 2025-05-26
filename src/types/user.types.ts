import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  bio?: string;
  city: string;
  isVerified: boolean;
  postsCount: number;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  userStatus: number;
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
  incrementPostsCount(): Promise<IUser>;
  decrementPostsCount(): Promise<IUser>;
}

export interface AuthRequestBody {
  email: string;
  password: string;
}