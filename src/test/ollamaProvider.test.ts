import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaProvider } from '../lib/ai/ollamaProvider';
import type { Message } from '../types';
import type { SetMessages } from '../lib/ai/types';

function makeNdjsonStream(lines: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(enc.encode(line + '\n'));
      }
      controller.close();
    },
  });
}

function makeSetMessagesMock(seed: Message[]): [SetMessages, () => Message[]] {
  const history: Message[][] = [];
  const mock: SetMessages = (updater) => {
    const prev = history.at(-1) ?? seed;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    history.push(next);
  };
  return [mock, () => history.at(-1) ?? seed];
}

describe('OllamaProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('appends streamed message content to assistant message', async () => {
    const stream = makeNdjsonStream([
      JSON.stringify({ message: { content: 'Hello ' } }),
      JSON.stringify({ message: { content: 'world' } }),
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(stream, { status: 200 })
    );

    const provider = new OllamaProvider();
    const seed: Message[] = [{ id: '1', role: 'user', text: 'Hi', createdAt: 0 }];
    const [setMessages, getLatest] = makeSetMessagesMock(seed);

    await provider.sendMessage('system', seed, 'Hi', setMessages);

    const last = getLatest().at(-1);
    expect(last?.role).toBe('assistant');
    expect(last?.text).toContain('Hello world');
  });

  it('inserts fallback text when stream produces no content', async () => {
    const stream = makeNdjsonStream([]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(stream, { status: 200 })
    );

    const provider = new OllamaProvider();
    const seed: Message[] = [{ id: '1', role: 'user', text: 'Hi', createdAt: 0 }];
    const [setMessages, getLatest] = makeSetMessagesMock(seed);

    await provider.sendMessage('system', seed, 'Hi', setMessages);

    const last = getLatest().at(-1);
    expect(last?.text).toBe("Sorry, I couldn't process that.");
  });

  it('adds error message on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'model not found' }), { status: 404 })
    );

    const provider = new OllamaProvider();
    const seed: Message[] = [{ id: '1', role: 'user', text: 'Hi', createdAt: 0 }];
    const [setMessages, getLatest] = makeSetMessagesMock(seed);

    await provider.sendMessage('system', seed, 'Hi', setMessages);

    const last = getLatest().at(-1);
    expect(last?.role).toBe('assistant');
    expect(last?.text).toContain('model not found');
  });

  it('handles error chunk in stream', async () => {
    const stream = makeNdjsonStream([
      JSON.stringify({ error: 'context length exceeded' }),
    ]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(stream, { status: 200 })
    );

    const provider = new OllamaProvider();
    const seed: Message[] = [{ id: '1', role: 'user', text: 'Hi', createdAt: 0 }];
    const [setMessages, getLatest] = makeSetMessagesMock(seed);

    await provider.sendMessage('system', seed, 'Hi', setMessages);

    const last = getLatest().at(-1);
    expect(last?.text).toContain('context length exceeded');
  });
});
