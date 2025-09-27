import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/errors.js';


const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('Decoded JWT:', decoded);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    console.log('User:', user);

    if (!user) {
      throw new AppError('User not found.', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Original Error:', error);
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Invalid token.', 401));
    }
  }
};

export { authMiddleware };