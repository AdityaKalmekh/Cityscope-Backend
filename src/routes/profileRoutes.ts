import express from "express";
import { handleUpdateProfile, handleGetProfile, handleGetUserProfile } from "../controllers/profile.controller";
import { authenticateToken } from "../middleware/auth.Middleware";

const routes = express.Router();

// Protected routes (require authentication)
// routes.put('/api/profile', authenticateToken, handleUpdateProfile);
// routes.get('/api/profile', authenticateToken, handleGetProfile);

routes.put('/api/profile', authenticateToken, handleUpdateProfile);
routes.get('/api/profile', authenticateToken, handleGetProfile);

// Public route to get any user's profile
routes.get('/api/profile/:userId', handleGetUserProfile);

export default routes;