import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import logger from './utils/logger';
import authRoutes from './routes/auth';
import cloudRoutes from './routes/cloud';
import storageRoutes from './routes/storage';
import sharedSavesRoutes from './routes/sharedSaves';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:1420'];
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list or is a Tauri origin
    if (allowedOrigins.includes(origin) || origin.startsWith('tauri://')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration is handled in individual route files

// Serve static files for OAuth callbacks
app.use('/auth/google/callback', express.static(path.join(__dirname, '../oauth-callbacks/google.html')));
app.use('/auth/microsoft/callback', express.static(path.join(__dirname, '../oauth-callbacks/microsoft.html')));
app.use('/auth/dropbox/callback', express.static(path.join(__dirname, '../oauth-callbacks/dropbox.html')));

// Routes
app.use('/auth', authRoutes);
app.use('/rest/oauth2-credential', authRoutes); // Additional route mapping for OAuth callbacks
app.use('/cloud', cloudRoutes);
app.use('/storage', storageRoutes);
app.use('/api', sharedSavesRoutes);

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  logger.info(`Cloud storage server running on port ${PORT}`);
});