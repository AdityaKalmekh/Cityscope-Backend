import { Request, Response } from 'express';
import { authenticateUser } from '../services/auth.service';
import { AuthRequestBody } from '../types/user.types';

// Single auth endpoint that handles both login and signup
export const handleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: AuthRequestBody = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        error: 'Missing required fields'
      });
      return;
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
        error: 'Invalid email format'
      });
      return;
    }

    // Validate password length
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
        error: 'Password too short'
      });
      return;
    }

    // Call auth service
    const result = await authenticateUser({ email, password });
    res.cookie('Auth_Token',
      result.data?.token,
      {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'strict',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
        httpOnly: false
      });
    if (!result.success) {
      // Determine status code based on error type
      let statusCode = 500;
      if (result.error === 'Incorrect password' || result.error === 'Invalid credentials') {
        statusCode = 401;
      } else if (result.error === 'Duplicate email' || result.message === 'Validation failed') {
        statusCode = 400;
      } else if (result.error === 'Account status inactive') {
        statusCode = 403;
      }

      res.status(statusCode).json(result);
      return;
    }

    // Success response
    const statusCode = result.data?.isNewUser ? 201 : 200;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('Auth controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: 'Something went wrong'
    });
  }
};