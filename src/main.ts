const loadEnv = require('./configs/env').default;
loadEnv();

import express, { Request, Response } from "express";
import cors from "cors"
import bodyParser from "body-parser";
import connectDB from "./configs/mongo-config";
import cookieParser from "cookie-parser";

// Import routes
import AuthRoute from "./routes/authRoutes";
import ProfileRoute from "./routes/profileRoutes";
import PostRoute from "./routes/postRoutes";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(bodyParser.json());
app.use(cookieParser());

async function initializeDatabase() {
    try {
        // Connect to MongoDB
        const mongoConnection = await connectDB();
        if (mongoConnection) {
            console.log('✅ MongoDB initialized successfully');
        } else {
            console.log('⚠️ MongoDB initialization failed');
        }
    } catch (error) {
        console.error('❌ Database initialization error:', error);
        process.exit(1);
    }
}

// API Routers
app.use('/cityscope', AuthRoute, ProfileRoute, PostRoute);

// 404 handler
app.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT;

const startServer = async () => {
    try {
        await initializeDatabase();

        app.listen(PORT, () => {
            console.info(`
              🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}
              👉 http://localhost:${PORT}
            `);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer().catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
});

export default app;