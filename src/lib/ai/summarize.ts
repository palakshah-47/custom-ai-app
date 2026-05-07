import type { Message } from '../../types';

const OLLAMA_MODEL: string = import.meta.env.VITE_OLLAMA_MODEL ?? 'tinyllama';

export async function summarizeMessages(
  messages: Message[],
  signal?: AbortSignal
): Promise<string> {
  const conversation = messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n\n');

  const res = await fetch('/api/ollama/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'You are a conversation summarizer. Summarize the following conversation concisely, preserving all important facts, decisions, and context. Write in third person. Be thorough but brief.',
        },
        {
          role: 'user',
          content: `Summarize this conversation:\n\n${conversation}`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Summarization request failed (${res.status})`);

  const data = (await res.json()) as { message?: { content?: string } };
  const text = data.message?.content?.trim() ?? '';
  if (!text) throw new Error('Empty summary returned');
  return text;
}
