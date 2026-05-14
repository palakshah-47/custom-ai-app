import { Router } from 'express';
import OpenAI from 'openai';
import { prisma } from '../lib/prisma.js';
import { requireAuth, ensureUser } from '../middleware/requireAuth.js';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

const CONTEXT_THRESHOLD = 20;
const MESSAGES_TO_SUMMARIZE = 14;

function applyVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => variables[name] || `{{${name}}}`);
}

async function summarizeOldMessages(
  messages: Array<{ role: string; text: string }>,
  temperature: number
): Promise<string> {
  const formatted = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');
  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature,
    messages: [
      {
        role: 'user',
        content: `Summarize the following conversation in 2-3 sentences, preserving key facts and context:\n\n${formatted}`,
      },
    ],
  });
  return completion.choices[0]?.message?.content ?? 'Previous conversation summary unavailable.';
}

router.use(requireAuth(), ensureUser);

router.post('/', async (req, res) => {
  const userId = req.auth!.userId;
  const { sessionId, agentId, userMessage } = req.body as {
    sessionId: string;
    agentId: string;
    userMessage: string;
  };

  if (!sessionId || !userMessage?.trim()) {
    return res.status(400).json({ error: 'sessionId and userMessage are required' });
  }

  const session = await prisma.session.findFirst({ where: { id: sessionId, userId } });
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const agent = agentId
    ? await prisma.agent.findFirst({ where: { id: agentId, userId } })
    : null;

  const rawPrompt =
    agent?.instructions || 'You are a helpful document analysis assistant.';
  const variables = (agent?.variables ?? {}) as Record<string, string>;
  const systemPrompt = applyVariables(rawPrompt, variables);
  const temperature = agent?.temperature ?? 0.7;
  const maxTokens = agent?.maxTokens ?? 1000;
  const topP = agent?.topP ?? 0.9;

  const savedUserMsg = await prisma.message.create({
    data: { sessionId, role: 'user', text: userMessage.trim() },
  });

  // Auto-title the session from the first user message
  let sessionTitle: string | undefined;
  if (!session.titleEdited) {
    const msgCount = await prisma.message.count({ where: { sessionId } });
    if (msgCount === 1) {
      const trimmed = userMessage.trim().split(/\r?\n/)[0] ?? '';
      sessionTitle = trimmed.length > 80 ? `${trimmed.slice(0, 80)}…` : trimmed || 'New chat';
      await prisma.session.update({ where: { id: sessionId }, data: { title: sessionTitle } });
    }
  }

  let dbMessages = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  // Summarize old messages if context is getting long
  if (dbMessages.length >= CONTEXT_THRESHOLD) {
    const toSummarize = dbMessages.slice(0, MESSAGES_TO_SUMMARIZE);
    const toKeep = dbMessages.slice(MESSAGES_TO_SUMMARIZE);
    try {
      const summaryText = await summarizeOldMessages(toSummarize, temperature);
      await prisma.message.deleteMany({
        where: { id: { in: toSummarize.map((m) => m.id) } },
      });
      const summaryMsg = await prisma.message.create({
        data: { sessionId, role: 'assistant', text: summaryText, isSummary: true },
      });
      dbMessages = [summaryMsg, ...toKeep];
    } catch {
      // Summarization failed — proceed with full history
    }
  }

  const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...dbMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    })),
  ];

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send the saved user message ID and optional new session title so frontend can sync
  res.write(`data: ${JSON.stringify({ type: 'user_msg', id: savedUserMsg.id, sessionTitle })}\n\n`);

  let fullText = '';
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      stream: true,
      stream_options: { include_usage: true },
      messages: openaiMessages,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
    });

    for await (const chunk of stream) {
      const piece = chunk.choices[0]?.delta?.content ?? '';
      if (piece) {
        fullText += piece;
        res.write(`data: ${JSON.stringify({ type: 'delta', content: piece })}\n\n`);
      }
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens;
        completionTokens = chunk.usage.completion_tokens;
      }
    }

    const assistantMsg = await prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        text: fullText || "Sorry, I couldn't process that.",
        tokens: completionTokens || undefined,
      },
    });

    res.write(
      `data: ${JSON.stringify({ type: 'done', id: assistantMsg.id, tokens: completionTokens || undefined, promptTokens: promptTokens || undefined })}\n\n`
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'OpenAI request failed';
    res.write(`data: ${JSON.stringify({ type: 'error', message: errMsg })}\n\n`);
  }

  res.end();
});

export default router;
