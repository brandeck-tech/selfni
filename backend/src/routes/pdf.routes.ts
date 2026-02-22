import { Router, Request, Response, NextFunction } from 'express';
import { generatePDF } from '../controllers/pdf.controller';
import { authenticate } from '../middleware/auth.middleware';
import jwt from 'jsonwebtoken';

const router = Router();

const authQuery = (req: any, res: Response, next: NextFunction) => {
  const token = req.query.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'مفيش token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || '') as any;
    next();
  } catch {
    return res.status(401).json({ message: 'token غلط' });
  }
};

router.get('/report', authQuery, generatePDF);

export default router;
