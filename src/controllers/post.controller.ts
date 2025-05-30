import { Request, Response } from 'express';
import {
  createPost,
  getPostsFeed,
  getUserCityFeed,
  togglePostDislike,
  togglePostLike,
} from '../services/post.service';
import { CreatePostRequest, PostQueryParams, PostType } from '../types/post.types';
import { uploadImageToCloudinary } from '../services/cloudinary.service';

// Define a simple file interface
interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

// Controller to create a new post
export const handleCreatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      });
      return;
    }

    const { content, postType, city }: CreatePostRequest = req.body;
    const userId = (req as any).userId;
    const imageFile = (req as any).file;

    // Validate required fields
    if (!content?.trim()) {
      res.status(400).json({
        success: false,
        message: 'Post content is required',
        error: 'Missing post content'
      });
      return;
    }

    if (!postType || !Object.values(PostType).includes(postType)) {
      res.status(400).json({
        success: false,
        message: 'Valid post type is required (recommend, help, update, event)',
        error: 'Invalid post type'
      });
      return;
    }

    // Additional validation
    if (content.trim().length > 280) {
      res.status(400).json({
        success: false,
        message: 'Post content cannot exceed 280 characters',
        error: 'Content too long'
      });
      return;
    }

    let imageUrl : string | undefined;
    if (imageFile) {
      console.log('Uploading image to Cloudinary');
      const uploadResult = await uploadImageToCloudinary(imageFile.buffer);
      
      if (!uploadResult.success){
         res.status(400).json({
          success: false,
          message: 'Failed to upload image',
          error: uploadResult.error
        });
        return;
      }
      imageUrl = uploadResult.data?.secureUrl;
      console.log('Image uploaded successfully:', imageUrl);   
    }
    // Call post service
    const result = await createPost(userId, {
      content: content.trim(),
      postType,
      image: imageUrl,
      city
    });

    if (!result.success) {
      // Determine status code based on error type
      let statusCode = 500;
      if (result.error === 'User does not exist') {
        statusCode = 404;
      } else if (result.error === 'Account status inactive') {
        statusCode = 403;
      } else if (result.error?.includes('Invalid') || result.message === 'Validation failed') {
        statusCode = 400;
      }

      res.status(statusCode).json(result);
      return;
    }

    // Success response
    res.status(201).json(result);

  } catch (error) {
    console.error('Create post controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    });
  }
};

export const handleTogglePostLike = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      });
      return;
    }

    const { postId } = req.params;
    const userId = req.userId;

    if (!postId) {
      res.status(400).json({
        success: false,
        message: 'Post ID is required',
        error: 'Missing post ID parameter'
      });
      return;
    }

    // Call post service
    const result = await togglePostLike(postId, userId);

    if (!result.success) {
      // Determine status code based on error type
      let statusCode = 500;
      if (result.error === 'Post does not exist') {
        statusCode = 404;
      } else if (result.error === 'Invalid ObjectId') {
        statusCode = 400;
      } else if (result.error === 'Post inactive') {
        statusCode = 404;
      }

      res.status(statusCode).json(result);
      return;
    }

    // Success response
    res.status(200).json(result);

  } catch (error) {
    console.error('Toggle post like controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    });
  }
};

export const handleTogglePostDislike = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      });
      return;
    }

    const { postId } = req.params;
    const userId = req.userId;

    if (!postId) {
      res.status(400).json({
        success: false,
        message: 'Post ID is required',
        error: 'Missing post ID parameter'
      });
      return;
    }

    // Call post service
    const result = await togglePostDislike(postId, userId);

    if (!result.success) {
      // Determine status code based on error type
      let statusCode = 500;
      if (result.error === 'Post does not exist') {
        statusCode = 404;
      } else if (result.error === 'Invalid ObjectId') {
        statusCode = 400;
      } else if (result.error === 'Post inactive') {
        statusCode = 404;
      }

      res.status(statusCode).json(result);
      return;
    }

    // Success response
    res.status(200).json(result);

  } catch (error) {
    console.error('Toggle post like controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    });
  }
}

export const handleGetUserCityFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      });
      return;
    }

    const userId = req.userId;
    const queryParams: PostQueryParams = {
      postType: req.query.postType as PostType,
      city: req.query.city as string, // This allows filtering by different cities if needed
      sortBy: (req.query.sortBy as 'newest' | 'oldest' | 'mostLiked') || 'newest', // Default to newest
      search: req.query.search as string
    };

    // Validate postType if provided
    if (queryParams.postType && !Object.values(PostType).includes(queryParams.postType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid post type filter',
        error: 'Post type must be one of: recommend, help, update, event'
      });
      return;
    }

    // Validate sortBy if provided
    const validSortOptions = ['newest', 'oldest', 'mostLiked'];
    if (queryParams.sortBy && !validSortOptions.includes(queryParams.sortBy)) {
      res.status(400).json({
        success: false,
        message: 'Invalid sort option',
        error: 'Sort by must be one of: newest, oldest, mostLiked'
      });
      return;
    }

    // Call post service - this will use user's city as default
    const result = await getUserCityFeed(userId, queryParams);

    if (!result.success) {
      // Determine status code based on error type
      let statusCode = 500;
      if (result.error === 'User does not exist') {
        statusCode = 404;
      } else if (result.error === 'Account status inactive') {
        statusCode = 403;
      } else if (result.error === 'Invalid ObjectId') {
        statusCode = 400;
      }

      res.status(statusCode).json(result);
      return;
    }

    // Success response
    res.status(200).json(result);

  } catch (error) {
    console.error('Get user city feed controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    });
  }
};

export const handleGetPostsFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryParams: PostQueryParams = {
      postType: req.query.postType as PostType,
      author: req.query.author as string,
      city: req.query.city as string,
      sortBy: req.query.sortBy as 'newest' | 'oldest' | 'mostLiked',
      search: req.query.search as string
    };

    // Validate postType if provided
    if (queryParams.postType && !Object.values(PostType).includes(queryParams.postType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid post type filter',
        error: 'Post type must be one of: recommend, help, update, event'
      });
      return;
    }

    // Validate sortBy if provided
    const validSortOptions = ['newest', 'oldest', 'mostLiked'];
    if (queryParams.sortBy && !validSortOptions.includes(queryParams.sortBy)) {
      res.status(400).json({
        success: false,
        message: 'Invalid sort option',
        error: 'Sort by must be one of: newest, oldest, mostLiked'
      });
      return;
    }

    // Call post service
    const result = await getPostsFeed(queryParams);

    if (!result.success) {
      res.status(500).json(result);
      return;
    }

    // Success response
    res.status(200).json(result);

  } catch (error) {
    console.error('Get posts feed controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    });
  }
};