import express from "express";
import { handleAuth } from "../controllers/auth.controller";

const routes = express.Router();

routes.post('/api/auth', handleAuth);

export default routes;