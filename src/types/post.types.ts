import { Document, Types } from "mongoose";

// Enum for post types as specified in the assignment
export enum PostType {
  RECOMMEND = 'recommend',
  HELP = 'help', 
  UPDATE = 'update',
  EVENT = 'event'
}

// Interface for post replies/comments
export interface IReply {
  _id?: Types.ObjectId;
  content: string;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for location data (optional for future expansion)
export interface ILocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

// Main Post interface extending Mongoose Document
export interface IPost extends Document {
  content: string;
  postType: PostType;
  image?: string; // URL to uploaded image
  author: Types.ObjectId; // Reference to User
  city: string;
  likes: Types.ObjectId[]; // Array of user IDs who liked
  dislikes: Types.ObjectId[]; // Array of user IDs who disliked  
  replies: IReply[]; // Array of replies/comments
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  addLike(userId: Types.ObjectId): Promise<IPost>;
  removeLike(userId: Types.ObjectId): Promise<IPost>;
  addDislike(userId: Types.ObjectId): Promise<IPost>;
  removeDislike(userId: Types.ObjectId): Promise<IPost>;
  addReply(reply: Omit<IReply, '_id' | 'createdAt' | 'updatedAt'>): Promise<IPost>;
  removeReply(replyId: Types.ObjectId): Promise<IPost>;
  getLikesCount(): number;
  getDislikesCount(): number;
  getRepliesCount(): number;
  isLikedBy(userId: Types.ObjectId): boolean;
  isDislikedBy(userId: Types.ObjectId): boolean;
}

// Request body interfaces for API endpoints
export interface CreatePostRequest {
  content: string;
  postType: PostType;
  image?: string;
  location?: Partial<ILocation>;
}

// Response interfaces
export interface PostResponse {
  success: boolean;
  message: string;
  data?: {
    post?: IPost;
    posts?: IPost[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalPosts: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  error?: string;
}

// Populated post interface (when author details are populated)
export interface IPopulatedPost extends Omit<IPost, 'author'> {
  author: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
    bio?: string;
    isVerified: boolean;
  };
}

export interface PostQueryParams {
  postType?: PostType;
  author?: string;
  city?: string; // Added city filter
  sortBy?: 'newest' | 'oldest' | 'mostLiked';
  search?: string;
}