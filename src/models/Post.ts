import mongoose, { Schema, Types } from "mongoose";
import { IPost, IReply, ILocation, PostType } from "../types/post.types";

// Reply sub-schema
const replySchema = new Schema<IReply>({
  content: {
    type: String,
    required: [true, 'Reply content is required'],
    trim: true,
    maxlength: [280, 'Reply cannot exceed 280 characters'],
    minlength: [1, 'Reply cannot be empty']
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reply author is required']
  }
}, {
  timestamps: true
});


// Main Post schema
const postSchema = new Schema<IPost>({
  content: {
    type: String,
    required: [true, 'Post content is required'],
    trim: true,
    maxlength: [280, 'Post content cannot exceed 280 characters'],
    minlength: [1, 'Post content cannot be empty']
  },
  
  postType: {
    type: String,
    enum: {
      values: Object.values(PostType),
      message: 'Post type must be one of: recommend, help, update, event'
    },
    required: [true, 'Post type is required']
  },
  
  image: {
    type: String,
    trim: true,
    validate: {
      validator: function(url: string) {
        if (!url) return true; // Optional field
        // Basic URL validation
        const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
        return urlRegex.test(url);
      },
      message: 'Invalid image URL format'
    }
  },
  
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Post author is required'],
    index: true
  },
  
  city: {
    type: String,
    required: true
  },
  
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  dislikes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  replies: [replySchema],
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for better query performance
postSchema.index({ createdAt: -1 }); // For chronological sorting
postSchema.index({ author: 1, createdAt: -1 }); // For user's posts
postSchema.index({ postType: 1, createdAt: -1 }); // For filtering by type
postSchema.index({ isActive: 1, createdAt: -1 }); // For active posts
postSchema.index({ 'likes': 1 }); // For like queries
postSchema.index({ 'location.coordinates': '2dsphere' }); // For geospatial queries

// Instance method to add a like
postSchema.methods.addLike = async function(userId: Types.ObjectId): Promise<IPost> {
  // Remove from dislikes if present
  this.dislikes = this.dislikes.filter((id: Types.ObjectId) => !id.equals(userId));
  
  // Add to likes if not already present
  if (!this.likes.some((id: Types.ObjectId) => id.equals(userId))) {
    this.likes.push(userId);
  }
  
  return await this.save();
};

// Instance method to remove a like
postSchema.methods.removeLike = async function(userId: Types.ObjectId): Promise<IPost> {
  this.likes = this.likes.filter((id: Types.ObjectId) => !id.equals(userId));
  return await this.save();
};

// Instance method to add a dislike
postSchema.methods.addDislike = async function(userId: Types.ObjectId): Promise<IPost> {
  // Remove from likes if present
  this.likes = this.likes.filter((id: Types.ObjectId) => !id.equals(userId));
  
  // Add to dislikes if not already present
  if (!this.dislikes.some((id: Types.ObjectId) => id.equals(userId))) {
    this.dislikes.push(userId);
  }
  
  return await this.save();
};

// Instance method to remove a dislike
postSchema.methods.removeDislike = async function(userId: Types.ObjectId): Promise<IPost> {
  this.dislikes = this.dislikes.filter((id: Types.ObjectId) => !id.equals(userId));
  return await this.save();
};

// Instance method to add a reply
postSchema.methods.addReply = async function(reply: Omit<IReply, '_id' | 'createdAt' | 'updatedAt'>): Promise<IPost> {
  this.replies.push(reply);
  return await this.save();
};

// Instance method to remove a reply
postSchema.methods.removeReply = async function(replyId: Types.ObjectId): Promise<IPost> {
  this.replies = this.replies.filter((reply) => !reply._id?.equals(replyId));
  return await this.save();
};

// Instance method to get likes count
postSchema.methods.getLikesCount = function(): number {
  return this.likes.length;
};

// Instance method to get dislikes count
postSchema.methods.getDislikesCount = function(): number {
  return this.dislikes.length;
};

// Instance method to get replies count
postSchema.methods.getRepliesCount = function(): number {
  return this.replies.length;
};

// Instance method to check if post is liked by user
postSchema.methods.isLikedBy = function(userId: Types.ObjectId): boolean {
  return this.likes.some((id: Types.ObjectId) => id.equals(userId));
};

// Instance method to check if post is disliked by user
postSchema.methods.isDislikedBy = function(userId: Types.ObjectId): boolean {
  return this.dislikes.some((id: Types.ObjectId) => id.equals(userId));
};

// Static method to get posts with pagination
postSchema.statics.getPaginatedPosts = async function(
  filter: any = {}, 
  options: { page: number; limit: number; sortBy: string } = { page: 1, limit: 10, sortBy: 'newest' }
) {
  const { page, limit, sortBy } = options;
  const skip = (page - 1) * limit;
  
  // Determine sort order
  let sort: any = { createdAt: -1 }; // Default: newest first
  if (sortBy === 'oldest') {
    sort = { createdAt: 1 };
  } else if (sortBy === 'mostLiked') {
    sort = { 'likes': -1, createdAt: -1 };
  }
  
  const posts = await this.find(filter)
    .populate('author', 'firstName lastName email bio isVerified')
    .populate('replies.author', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();
  
  const totalPosts = await this.countDocuments(filter);
  const totalPages = Math.ceil(totalPosts / limit);
  
  return {
    posts,
    pagination: {
      currentPage: page,
      totalPages,
      totalPosts,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
};

// Pre-save middleware to validate post constraints
postSchema.pre('save', async function(next) {
  // Ensure user cannot like and dislike at the same time
  const likeSet = new Set(this.likes.map(id => id.toString()));
  const dislikeSet = new Set(this.dislikes.map(id => id.toString()));
  
  // Remove any user IDs that appear in both arrays
  this.likes = this.likes.filter(id => !dislikeSet.has(id.toString()));
  this.dislikes = this.dislikes.filter(id => !likeSet.has(id.toString()));
  
  next();
});

// Post-save middleware to update user's posts count
postSchema.post('save', async function(doc) {
  if (this.isNew) {
    // Increment user's posts count when new post is created
    await mongoose.model('User').findByIdAndUpdate(
      doc.author,
      { $inc: { postsCount: 1 } }
    );
  }
});

// Post-remove middleware to decrement user's posts count
postSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    // Decrement user's posts count when post is deleted
    await mongoose.model('User').findByIdAndUpdate(
      doc.author,
      { $inc: { postsCount: -1 } }
    );
  }
});

const Post = mongoose.model<IPost>('Post', postSchema);
export default Post;