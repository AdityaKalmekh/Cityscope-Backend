// profile.controller.ts
import { Request, Response } from 'express';
import { updateUserProfile, getUserProfile } from '../services/profile.service';

interface AuthenticatedRequest extends Request {
  userId: string
}

interface UpdateProfileRequestBody {
  firstName: string;
  lastName: string;
  city: string;
  bio?: string;
}

// Controller to update user profile
export const handleUpdateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated (this should be set by auth middleware)
    if (!req.userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'User not authenticated'
      });
      return;
    }

    const { firstName, lastName, bio, city }: UpdateProfileRequestBody = req.body;
    const userId = req.userId;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim()) {
      res.status(400).json({
        success: false,
        message: 'First name and last name are required',
        error: 'Missing required fields'
      });
      return;
    }

    // Validate field lengths (additional client-side validation)
    if (firstName.trim().length < 1 || firstName.trim().length > 50) {
      res.status(400).json({
        success: false,
        message: 'First name must be between 1 and 50 characters',
        error: 'Invalid first name length'
      });
      return;
    }

    if (lastName.trim().length < 1 || lastName.trim().length > 50) {
      res.status(400).json({
        success: false,
        message: 'Last name must be between 1 and 50 characters',
        error: 'Invalid last name length'
      });
      return;
    }

    if (bio && bio.trim().length > 160) {
      res.status(400).json({
        success: false,
        message: 'Bio cannot exceed 160 characters',
        error: 'Invalid bio length'
      });
      return;
    }

    // Call profile service
    const result = await updateUserProfile(userId, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      bio: bio?.trim(),
      city: city
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
    res.status(200).json(result);

  } catch (error) {
    console.error('Profile update controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    });
  }
};

// Controller to get user profile
export const handleGetProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    // Call profile service
    const result = await getUserProfile(userId);

    if (!result.success) {
      // Determine status code based on error type
      let statusCode = 500;
      if (result.error === 'User does not exist') {
        statusCode = 404;
      } else if (result.error === 'Account status inactive') {
        statusCode = 403;
      } else if (result.error?.includes('Invalid')) {
        statusCode = 400;
      }

      res.status(statusCode).json(result);
      return;
    }

    // Success response
    res.status(200).json(result);

  } catch (error) {
    console.error('Get profile controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    });
  }
};

// Controller to get any user's public profile (by user ID from params)
export const handleGetUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required',
        error: 'Missing user ID parameter'
      });
      return;
    }

    // Call profile service
    const result = await getUserProfile(userId);

    if (!result.success) {
      // Determine status code based on error type
      let statusCode = 500;
      if (result.error === 'User does not exist') {
        statusCode = 404;
      } else if (result.error === 'Account status inactive') {
        statusCode = 403;
      } else if (result.error?.includes('Invalid')) {
        statusCode = 400;
      }

      res.status(statusCode).json(result);
      return;
    }

    // Success response
    res.status(200).json(result);

  } catch (error) {
    console.error('Get user profile controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    });
  }
};