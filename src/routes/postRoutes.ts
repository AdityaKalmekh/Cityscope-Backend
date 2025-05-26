import express from "express";
import {
    handleCreatePost,
    handleGetPostsFeed,
    handleGetUserCityFeed,
    handleTogglePostDislike,
    handleTogglePostLike
} from "../controllers/post.controller";
import upload from "../middleware/upload.middleware";
import { authenticateToken } from "../middleware/auth.Middleware";

const routes = express.Router();

// PUublic Route
routes.get('/api/posts/feed', authenticateToken, handleGetUserCityFeed);
routes.get('/api/posts', authenticateToken, handleGetPostsFeed)

// Protected Route
routes.post('/api/posts', authenticateToken, upload.single('image'), handleCreatePost);

// post interactions
routes.post('/api/posts/:postId/like', authenticateToken, handleTogglePostLike);
routes.post('/api/posts/:postId/dislike', authenticateToken, handleTogglePostDislike);

export default routes; 