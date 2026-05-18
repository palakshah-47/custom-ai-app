import { Router, Request } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, ensureUser } from '../middleware/requireAuth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
    }
  }
}

const router = Router();

router.use(requireAuth(), ensureUser);

router.get('/', async (req, res) => {
  const userId = req.auth!.userId;
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(sessions);
});

router.post('/', async (req, res) => {
  const userId = req.auth!.userId;
  const session = await prisma.session.create({
    data: { userId },
    include: { messages: true },
  });
  res.status(201).json(session);
});

router.patch('/:id', async (req, res) => {
  const userId = req.auth!.userId;
  const { id } = req.params;
  const { title, titleEdited, archived, bookmarked } = req.body as {
    title?: string;
    titleEdited?: boolean;
    archived?: boolean;
    bookmarked?: boolean;
  };

  const existing = await prisma.session.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: 'Session not found' });

  const updated = await prisma.session.update({
    where: { id },
    data: {
      ...(title !== undefined && { title, titleEdited: titleEdited ?? true }),
      ...(archived !== undefined && { archived }),
      ...(bookmarked !== undefined && { bookmarked }),
    },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const userId = req.auth!.userId;
  const { id } = req.params;

  const existing = await prisma.session.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: 'Session not found' });

  await prisma.session.delete({ where: { id } });
  res.status(204).send();
});

router.patch('/:id/messages/:msgId', async (req, res) => {
  const userId = req.auth!.userId;
  const { id, msgId } = req.params;
  const { rating } = req.body as { rating: 'up' | 'down' | null };

  const session = await prisma.session.findFirst({ where: { id, userId } });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const msg = await prisma.message.findFirst({ where: { id: msgId, sessionId: id } });
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const updated = await prisma.message.update({
    where: { id: msgId },
    data: { rating: msg.rating === rating ? null : rating },
  });
  res.json(updated);
});

export default router;
