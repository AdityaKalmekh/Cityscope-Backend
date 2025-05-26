import User from "../models/User";
import { IUser } from "../types/user.types";

interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  city: string;
  bio?: string;
}

interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data?: {
    user: Partial<IUser>;
  };
  error?: string;
}

export const updateUserProfile = async (
  userId: string, 
  profileData: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  try {
    // Validate userId
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
        error: 'Missing user ID'
      };
    }

    // Validate required fields
    if (!profileData.firstName?.trim() || !profileData.lastName?.trim()) {
      return {
        success: false,
        message: 'First name and last name are required',
        error: 'Missing required fields'
      };
    }

    // Validate field lengths
    if (profileData.firstName.trim().length > 50) {
      return {
        success: false,
        message: 'First name cannot exceed 50 characters',
        error: 'Invalid first name length'
      };
    }

    if (profileData.lastName.trim().length > 50) {
      return {
        success: false,
        message: 'Last name cannot exceed 50 characters',
        error: 'Invalid last name length'
      };
    }

    if (profileData.bio && profileData.bio.trim().length > 160) {
      return {
        success: false,
        message: 'Bio cannot exceed 160 characters',
        error: 'Invalid bio length'
      };
    }

    // Find user by ID
    const user = await User.findById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found',
        error: 'User does not exist'
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is deactivated',
        error: 'Account status inactive'
      };
    }

    // Prepare update data
    const updateData = {
      firstName: profileData.firstName.trim(),
      lastName: profileData.lastName.trim(),
      bio: profileData.bio ? profileData.bio.trim() : user.bio, // Keep existing bio if not provided
      city: profileData.city,
      updatedAt: new Date()
    };

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { 
        new: true, // Return updated document
        runValidators: true // Run mongoose validators
      }
    );

    if (!updatedUser) {
      return {
        success: false,
        message: 'Failed to update profile',
        error: 'Update operation failed'
      };
    }

    // Return updated user data (excluding password)
    const userResponse = {
      _id: updatedUser._id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      bio: updatedUser.bio,
      isVerified: updatedUser.isVerified,
      postsCount: updatedUser.postsCount,
      isActive: updatedUser.isActive,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse
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

    // Handle cast error (invalid ObjectId)
    if (error.name === 'CastError') {
      return {
        success: false,
        message: 'Invalid user ID format',
        error: 'Invalid ObjectId'
      };
    }

    console.error('Profile service error:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    };
  }
};

// Service to get user profile by ID
export const getUserProfile = async (userId: string): Promise<UpdateProfileResponse> => {
  try {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
        error: 'Missing user ID'
      };
    }

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

    const userResponse = {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      bio: user.bio,
      isVerified: user.isVerified,
      postsCount: user.postsCount,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: userResponse
      }
    };

  } catch (error: any) {
    if (error.name === 'CastError') {
      return {
        success: false,
        message: 'Invalid user ID format',
        error: 'Invalid ObjectId'
      };
    }

    console.error('Get profile service error:', error);
    return {
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    };
  }
};