import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
  provider?: string;
  accessToken?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // In a production app, you would verify the token here
  // For now, we'll just pass it through
  req.accessToken = token;
  
  // Extract provider from header or query
  req.provider = req.headers['x-cloud-provider'] as string || req.query.provider as string;
  
  if (!req.provider) {
    return res.status(400).json({ error: 'Cloud provider not specified' });
  }

  next();
};