import jwt from 'jsonwebtoken';
import User from '../models/User';
import { IUser } from '../types/user.types';

interface AuthRequest {
    email: string;
    password: string;
}

interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: Partial<IUser>;
        token: string;
        isNewUser: boolean;
    };
    error?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token
const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, JWT_SECRET);
};

// Main auth service function
export const authenticateUser = async ({ email, password }: AuthRequest): Promise<AuthResponse> => {
    try {
        // Check if user exists
        const existingUser = await User.findOne({ email }).select('+password');

        if (existingUser) {
            // User exists - handle login
            const isPasswordValid = await existingUser.comparePassword(password);

            if (!isPasswordValid) {
                return {
                    success: false,
                    message: 'Invalid credentials',
                    error: 'Incorrect password'
                };
            }

            // Check if user is active
            if (!existingUser.isActive) {
                return {
                    success: false,
                    message: 'Account is deactivated',
                    error: 'Account status inactive'
                };
            }

            // Generate token
            const token = generateToken(String(existingUser._id));

            // Return user data without password
            const userResponse = {
                _id: existingUser._id,
                email: existingUser.email,
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                bio: existingUser.bio,
                isVerified: existingUser.isVerified,
                postsCount: existingUser.postsCount,
                isActive: existingUser.isActive,
                createdAt: existingUser.createdAt,
                updatedAt: existingUser.updatedAt
            };

            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: userResponse,
                    token,
                    isNewUser: false
                }
            };
        } else {
            // User doesn't exist - handle signup
            const newUser = new User({
                email,
                password,
                firstName: '', // Will be updated via profile route
                lastName: '',  // Will be updated via profile route
                bio: ''  ,     // Will be updated via profile route
                city: ''
            });

            const savedUser = await newUser.save();

            // Generate token
            const token = generateToken(String(savedUser._id));

            // Return user data
            const userResponse = {
                _id: savedUser._id,
                email: savedUser.email,
                firstName: savedUser.firstName,
                lastName: savedUser.lastName,
                bio: savedUser.bio,
                isVerified: savedUser.isVerified,
                postsCount: savedUser.postsCount,
                isActive: savedUser.isActive,
                createdAt: savedUser.createdAt,
                updatedAt: savedUser.updatedAt
            };

            return {
                success: true,
                message: 'Account created successfully',
                data: {
                    user: userResponse,
                    token,
                    isNewUser: true
                }
            };
        }
    } catch (error: any) {
        // Handle duplicate email error
        if (error.code === 11000) {
            return {
                success: false,
                message: 'Email already exists',
                error: 'Duplicate email'
            };
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map((err: any) => err.message);
            return {
                success: false,
                message: 'Validation failed',
                error: validationErrors.join(', ')
            };
        }

        console.error('Auth service error:', error);
        return {
            success: false,
            message: 'Internal server error',
            error: 'Something went wrong'
        };
    }
};

// Verify JWT token
export const verifyToken = (token: string): { userId: string } | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded;
    } catch (error) {
        return null;
    }
};

// Get user by ID (for protected routes)
export const getUserById = async (userId: string): Promise<IUser | null> => {
    try {
        const user = await User.findById(userId);
        return user;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
};