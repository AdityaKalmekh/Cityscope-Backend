import { Types } from 'mongoose';
import Post from '../models/Post';
import User from '../models/User';
import { 
  CreatePostRequest, 
  PostQueryParams, 
  PostResponse,
  PostType 
} from '../types/post.types';

// Service to create a new post
export const createPost = async (
  userId: string, 
  postData: CreatePostRequest
): Promise<PostResponse> => {
  try {    
    // Validate userId
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
        error: 'Missing user ID'
      };
    }

    // Check if user exists and is active
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'User does not exist'
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is deactivated',
        error: 'Account status inactive'
      };
    }

    // Validate required fields
    if (!postData.content?.trim()) {
      return {
        success: false,
        message: 'Post content is required',
        error: 'Missing post content'
      };
    }

    if (!postData.postType || !Object.values(PostType).includes(postData.postType)) {
      return {
        success: false,
        message: 'Valid post type is required',
        error: 'Invalid post type'
      };
    }

    // Validate content length
    if (postData.content.trim().length > 280) {
      return {
        success: false,
        message: 'Post content cannot exceed 280 characters',
        error: 'Content too long'
      };
    }

    // Create new post
    const newPost = new Post({
      content: postData.content.trim(),
      postType: postData.postType,
      image: postData.image?.trim() || undefined,
      author: new Types.ObjectId(userId),
      city: postData.city || undefined
    });

    const savedPost = await newPost.save();

    // Populate author details
    const populatedPost = await Post.findById(savedPost._id)
      .populate('author', 'firstName lastName email bio isVerified')
      .exec();

    return {
      success: true,
      message: 'Post created successfully',
      data: {
        post: populatedPost!
      }
    };

  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return {
        success: false,
        message: 'Validation failed',
        error: validationErrors.join(', ')
      };
    }

    console.error('Create post service error:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    };
  }
};

export const togglePostLike = async (postId: string, userId: string): Promise<PostResponse> => {
  try {
    if (!postId || !userId) {
      return {
        success: false,
        message: 'Post ID and User ID are required',
        error: 'Missing required parameters'
      };
    }

    const post = await Post.findById(postId);
    if (!post) {
      return {
        success: false,
        message: 'Post not found',
        error: 'Post does not exist'
      };
    }

    if (!post.isActive) {
      return {
        success: false,
        message: 'Cannot like inactive post',
        error: 'Post inactive'
      };
    }

    const userObjectId = new Types.ObjectId(userId);
    const isLiked = post.isLikedBy(userObjectId);

    if (isLiked) {
      await post.removeLike(userObjectId);
    } else {
      await post.addLike(userObjectId);
    }

    // Populate author details
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'firstName lastName email bio isVerified')
      .exec();

    return {
      success: true,
      message: isLiked ? 'Post unliked successfully' : 'Post liked successfully',
      data: {
        post: populatedPost!
      }
    };

  } catch (error: any) {
    if (error.name === 'CastError') {
      return {
        success: false,
        message: 'Invalid post ID format',
        error: 'Invalid ObjectId'
      };
    }

    console.error('Toggle post like service error:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    };
  }
};

export const togglePostDislike = async (postId: string, userId: string): Promise<PostResponse> => {
  try {
    if (!postId || !userId) {
      return {
        success: false,
        message: 'Post ID and User ID are required',
        error: 'Missing required parameters'
      };
    }

    const post = await Post.findById(postId);
    if (!post) {
      return {
        success: false,
        message: 'Post not found',
        error: 'Post does not exist'
      };
    }

    if (!post.isActive) {
      return {
        success: false,
        message: 'Cannot dislike inactive post',
        error: 'Post inactive'
      };
    }

    const userObjectId = new Types.ObjectId(userId);
    const isDisliked = post.isDislikedBy(userObjectId);

    if (isDisliked) {
      await post.removeDislike(userObjectId);
    } else {
      await post.addDislike(userObjectId);
    }

    // Populate author details
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'firstName lastName email bio isVerified')
      .exec();

    return {
      success: true,
      message: isDisliked ? 'Post undisliked successfully' : 'Post disliked successfully',
      data: {
        post: populatedPost!
      }
    };

  } catch (error: any) {
    if (error.name === 'CastError') {
      return {
        success: false,
        message: 'Invalid post ID format',
        error: 'Invalid ObjectId'
      };
    }

    console.error('Toggle post dislike service error:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    };
  }
};

export const getPostsFeed = async (queryParams: PostQueryParams): Promise<PostResponse> => {
  try {
    const {
      postType,
      author,
      city,
      sortBy = 'newest',
      search
    } = queryParams;

    // Build filter object
    const filter: any = { isActive: true };

    // City filter
    if (city?.trim()) {
      filter.city = city.trim();
    }

    // Post type filter
    if (postType && Object.values(PostType).includes(postType)) {
      filter.postType = postType;
    }

    // Author filter
    if (author) {
      filter.author = new Types.ObjectId(author);
    }

    // Search filter
    if (search?.trim()) {
      filter.content = { $regex: search.trim(), $options: 'i' };
    }

    // Determine sort order
    let sort: any = { createdAt: -1 }; // Default: newest first
    if (sortBy === 'oldest') {
      sort = { createdAt: 1 };
    } else if (sortBy === 'mostLiked') {
      sort = { 'likes': -1, createdAt: -1 };
    }

    // Get all posts with filters and sorting
    const posts = await Post.find(filter)
      .populate('author', 'firstName lastName email bio isVerified')
      .populate('replies.author', 'firstName lastName email')
      .sort(sort)
      .exec();

    return {
      success: true,
      message: 'Posts retrieved successfully',
      data: {
        posts
      }
    };

  } catch (error) {
    console.error('Get posts feed service error:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    };
  }
};

export const getUserCityFeed = async (userId: string, queryParams: PostQueryParams = {}): Promise<PostResponse> => {
  try {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
        error: 'Missing user ID'
      };
    }

    // Get user's city
    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'User does not exist'
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is deactivated',
        error: 'Account status inactive'
      };
    }

    // Use user's city as default city filter if no city is specified in query
    const cityFilter = queryParams.city || user.city;

    // Get posts for the city
    return await getPostsFeed({
      ...queryParams,
      city: cityFilter
    });

  } catch (error: any) {
    if (error.name === 'CastError') {
      return {
        success: false,
        message: 'Invalid user ID format',
        error: 'Invalid ObjectId'
      };
    }

    console.error('Get user city feed service error:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    };
  }
};