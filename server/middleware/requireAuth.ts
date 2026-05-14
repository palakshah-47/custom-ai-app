import { requireAuth as clerkRequireAuth } from '@clerk/express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export const requireAuth = () => clerkRequireAuth();

export async function ensureUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.auth?.userId;
  if (!userId) return next();
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });
  next();
}
