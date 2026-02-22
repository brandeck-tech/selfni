import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { id: number; email: string; username: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'مفيش token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ status: 'error', message: 'token غلط أو منتهي' });
  }
};
