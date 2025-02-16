import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/user.model';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET ?? '';

export interface AuthRequest extends Request {
  user?: string;
}

const authMiddleWare = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.user = decoded.userId;

    // check if user is verified
    const user = await User.findById(decoded.userId);
    if (!user?.isVerified) {
      return res
        .status(403)
        .json({ message: 'Please verify your email to continue' });
    }

    return next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export default authMiddleWare;
