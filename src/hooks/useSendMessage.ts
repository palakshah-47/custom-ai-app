import React, { useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useChatStore } from '../store/chatStore';
import { useAgentStore } from '../store/agentStore';
import type { Message } from '../types';

export function useSendMessage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { getToken } = useAuth();

  const message = useChatStore((s) => s.message);
  const loading = useChatStore((s) => s.loading);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);
  const setMessage = useChatStore((s) => s.setMessage);
  const setLoading = useChatStore((s) => s.setLoading);
  const setMessagesForSession = useChatStore((s) => s.setMessagesForSession);
  const addUserMessageToSession = useChatStore((s) => s.addUserMessageToSession);
  const patchSessionLocally = useChatStore((s) => s.patchSessionLocally);

  const activeAgentId = useAgentStore((s) => s.activeAgentId);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, loading, activeSessionId]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    const sessionId = activeSessionId;

    setMessage('');
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Optimistically add the user message to the UI
    const optimisticUserMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: userMsg,
      createdAt: Date.now(),
    };
    addUserMessageToSession(sessionId, optimisticUserMsg);

    // Reserve an assistant message slot for streaming
    const assistantPlaceholder: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: '',
      createdAt: Date.now(),
    };
    const setMsgs = setMessagesForSession(sessionId);
    setMsgs((prev) => [...prev, assistantPlaceholder]);

    try {
      const token = await getToken();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ sessionId, agentId: activeAgentId, userMessage: userMsg }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const json = trimmed.slice(5).trim();
          if (!json) continue;

          try {
            const event = JSON.parse(json) as {
              type: string;
              content?: string;
              id?: string;
              tokens?: number;
              sessionTitle?: string;
            };

            if (event.type === 'user_msg') {
              // Sync the DB-generated title for this session (only on first message)
              if (event.sessionTitle) {
                patchSessionLocally(sessionId, { title: event.sessionTitle });
              }
            } else if (event.type === 'delta' && event.content) {
              setMsgs((prev) => {
                const next = [...prev];
                const last = next.at(-1);
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, text: last.text + event.content };
                }
                return next;
              });
            } else if (event.type === 'done') {
              // Update the placeholder ID and token count with the real DB values
              setMsgs((prev) => {
                const next = [...prev];
                const last = next.at(-1);
                if (last?.role === 'assistant') {
                  next[next.length - 1] = {
                    ...last,
                    id: event.id ?? last.id,
                    tokens: event.tokens,
                  };
                }
                return next;
              });
            } else if (event.type === 'error') {
              setMsgs((prev) => {
                const next = [...prev];
                const last = next.at(-1);
                if (last?.role === 'assistant') {
                  next[next.length - 1] = { ...last, text: 'An error occurred. Please try again.' };
                }
                return next;
              });
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setMsgs((prev) => {
        const next = [...prev];
        const last = next.at(-1);
        if (last?.role === 'assistant') {
          return [...next.slice(0, -1), { ...last, text: 'An error occurred. Please try again.' }];
        }
        return [
          ...next,
          {
            id: crypto.randomUUID(),
            role: 'assistant' as const,
            text: 'An error occurred. Please try again.',
            createdAt: Date.now(),
          },
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSuggestion = (text: string) => {
    setMessage(text);
    textareaRef.current?.focus();
  };

  return {
    textareaRef,
    messagesEndRef,
    loading,
    handleSend: () => void handleSend(),
    stopGeneration,
    handleKeyDown,
    handleSuggestion,
  };
}
