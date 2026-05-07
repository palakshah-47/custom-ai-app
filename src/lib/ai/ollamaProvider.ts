import type { AIProvider, SendOptions, SetMessages } from './types';
import type { Message } from '../../types';

const OLLAMA_MODEL: string = import.meta.env.VITE_OLLAMA_MODEL ?? 'tinyllama';

function buildOllamaMessages(
  systemPrompt: string,
  priorMessages: Message[],
  userMsg: string
): Array<{ role: string; content: string }> {
  const msgs: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  for (const m of priorMessages) {
    msgs.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
  }
  msgs.push({ role: 'user', content: userMsg });
  return msgs;
}

async function consumeOllamaChatStream(response: Response, setMessages: SetMessages): Promise<number | undefined> {
  const reader = response.body?.getReader();
  if (!reader) {
    setMessages((prev) => {
      const next = [...prev];
      const last = next.at(-1);
      if (last?.role === 'assistant') {
        next[next.length - 1] = { ...last, text: 'No response body from Ollama.' };
      }
      return next;
    });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let evalCount: number | undefined;

  function processChunk(chunk: Record<string, unknown>) {
    if (chunk['error']) {
      const errRaw = chunk['error'];
      const errText =
        typeof errRaw === 'string'
          ? errRaw
          : (errRaw as { message?: string } | undefined)?.message ?? 'Ollama stream error';
      setMessages((prev) => {
        const next = [...prev];
        const last = next.at(-1);
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: errText };
        return next;
      });
      return;
    }
    if (chunk['done'] === true && typeof chunk['eval_count'] === 'number') {
      evalCount = chunk['eval_count'] as number;
    }
    const piece = (chunk['message'] as { content?: string } | undefined)?.content;
    if (piece) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next.at(-1);
        if (last?.role === 'assistant') next[next.length - 1] = { ...last, text: last.text + piece };
        return next;
      });
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.replace(/\r$/, '').trim();
      if (!trimmed) continue;
      try { processChunk(JSON.parse(trimmed) as Record<string, unknown>); } catch { continue; }
    }
  }

  const tail = buffer.replace(/\r$/, '').trim();
  if (tail) {
    try { processChunk(JSON.parse(tail) as Record<string, unknown>); } catch { /* ignore */ }
  }

  setMessages((prev) => {
    const next = [...prev];
    const last = next.at(-1);
    if (!last || last.role !== 'assistant') return next;
    const patch: Partial<typeof last> = {};
    if (!last.text.trim()) patch.text = "Sorry, I couldn't process that.";
    if (evalCount !== undefined) patch.tokens = evalCount;
    return Object.keys(patch).length ? [...next.slice(0, -1), { ...last, ...patch }] : next;
  });

  return evalCount;
}

export class OllamaProvider implements AIProvider {
  async sendMessage(
    systemPrompt: string,
    history: Message[],
    userText: string,
    setMessages: SetMessages,
    options: SendOptions = {}
  ): Promise<void> {
    const { signal, temperature = 0.7, maxTokens = 1000, topP = 0.9 } = options;
    const res = await fetch('/api/ollama/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: true,
        messages: buildOllamaMessages(systemPrompt, history, userText),
        options: { num_predict: maxTokens, temperature, top_p: topP },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      let errMsg = `Ollama request failed (${res.status}). Is Ollama running? Set OLLAMA_HOST and run ollama pull ${OLLAMA_MODEL}.`;
      try {
        const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
        const errRaw = data['error'];
        errMsg =
          (typeof errRaw === 'string'
            ? errRaw
            : (errRaw as { message?: string } | undefined)?.message) ||
          (data['message'] as string | undefined) ||
          text ||
          errMsg;
      } catch {
        if (text) errMsg = text;
      }
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: 'assistant', text: String(errMsg), createdAt: Date.now() },
      ]);
      return;
    }

    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: 'assistant', text: '', createdAt: Date.now() },
    ]);
    await consumeOllamaChatStream(res, setMessages);
  }
}
