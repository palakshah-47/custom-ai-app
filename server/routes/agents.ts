import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, ensureUser } from '../middleware/requireAuth.js';

const router = Router();

router.use(requireAuth(), ensureUser);

router.get('/', async (req, res) => {
  const userId = req.auth!.userId;
  const agents = await prisma.agent.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(agents);
});

router.post('/', async (req, res) => {
  const userId = req.auth!.userId;
  const body = req.body as Record<string, unknown>;
  const agent = await prisma.agent.create({
    data: {
      userId,
      name: (body.name as string) ?? 'New Agent',
      description: (body.description as string) ?? '',
      category: (body.category as string) ?? 'Others',
      instructions: (body.instructions as string) ?? '',
      enableArtifacts: (body.enableArtifacts as boolean) ?? false,
      enableHighQuality: (body.enableHighQuality as boolean) ?? false,
      advancedControl: (body.advancedControl as boolean) ?? false,
      enableFileSearch: (body.enableFileSearch as boolean) ?? false,
      supportName: (body.supportName as string) ?? '',
      supportEmail: (body.supportEmail as string) ?? '',
      temperature: (body.temperature as number) ?? 0.7,
      maxTokens: (body.maxTokens as number) ?? 1000,
      topP: (body.topP as number) ?? 0.9,
      variables: (body.variables as object) ?? {},
    },
  });
  res.status(201).json(agent);
});

router.patch('/:id', async (req, res) => {
  const userId = req.auth!.userId;
  const { id } = req.params;

  const existing = await prisma.agent.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: 'Agent not found' });

  const body = req.body as Record<string, unknown>;
  const updated = await prisma.agent.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name as string }),
      ...(body.description !== undefined && { description: body.description as string }),
      ...(body.category !== undefined && { category: body.category as string }),
      ...(body.instructions !== undefined && { instructions: body.instructions as string }),
      ...(body.enableArtifacts !== undefined && { enableArtifacts: body.enableArtifacts as boolean }),
      ...(body.enableHighQuality !== undefined && { enableHighQuality: body.enableHighQuality as boolean }),
      ...(body.advancedControl !== undefined && { advancedControl: body.advancedControl as boolean }),
      ...(body.enableFileSearch !== undefined && { enableFileSearch: body.enableFileSearch as boolean }),
      ...(body.supportName !== undefined && { supportName: body.supportName as string }),
      ...(body.supportEmail !== undefined && { supportEmail: body.supportEmail as string }),
      ...(body.temperature !== undefined && { temperature: body.temperature as number }),
      ...(body.maxTokens !== undefined && { maxTokens: body.maxTokens as number }),
      ...(body.topP !== undefined && { topP: body.topP as number }),
      ...(body.variables !== undefined && { variables: body.variables as object }),
    },
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const userId = req.auth!.userId;
  const { id } = req.params;

  const existing = await prisma.agent.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ error: 'Agent not found' });

  await prisma.agent.delete({ where: { id } });
  res.status(204).send();
});

export default router;
