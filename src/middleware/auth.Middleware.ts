import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById } from '../services/auth.service';

// Middleware to verify JWT token
export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const token = req.cookies.Auth_Token;
        
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required',
                error: 'No token provided'
            });
            return;
        }

        // Verify token
        const decoded = verifyToken(token);

        if (!decoded) {
            res.status(403).json({
                success: false,
                message: 'Invalid or expired token',
                error: 'Token verification failed'
            });
            return;
        }

        // Get user data
        const user = await getUserById(decoded.userId);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
                error: 'User does not exist'
            });
            return;
        }

        if (!user.isActive) {
            res.status(403).json({
                success: false,
                message: 'Account is deactivated',
                error: 'Account status inactive'
            });
            return;
        }

        // Attach user info to request
        // req.user = {
        //     userId: decoded.userId,
        //     userData: user
        // };

        (req as any).userId = decoded.userId;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: 'Authentication failed'
        });
    }
};