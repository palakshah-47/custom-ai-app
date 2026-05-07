import React, { useRef, useCallback, useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import { useAgentStore } from "../store/agentStore";
import { getAIProvider } from "../lib/ai";
import { summarizeMessages } from "../lib/ai/summarize";
import type { Message } from "../types";

function applyVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => variables[name] || `{{${name}}}`);
}

const CONTEXT_THRESHOLD = 20;
const MESSAGES_TO_SUMMARIZE = 14;

export function useSendMessage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const message = useChatStore((s) => s.message);
  const loading = useChatStore((s) => s.loading);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);
  const setMessage = useChatStore((s) => s.setMessage);
  const setLoading = useChatStore((s) => s.setLoading);
  const setMessagesForSession = useChatStore((s) => s.setMessagesForSession);
  const addUserMessageToSession = useChatStore(
    (s) => s.addUserMessageToSession
  );

  const agents = useAgentStore((s) => s.agents);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const activeAgent = agents.find((a) => a.id === activeAgentId);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, loading, activeSessionId]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    const sessionId = activeSessionId;
    const priorMessages = messages;

    setMessage("");
    setLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Summarize oldest messages if context is getting long
    let effectivePriorMessages: Message[] = priorMessages;
    if (priorMessages.length >= CONTEXT_THRESHOLD) {
      const toSummarize = priorMessages.slice(0, MESSAGES_TO_SUMMARIZE);
      const toKeep = priorMessages.slice(MESSAGES_TO_SUMMARIZE);
      try {
        const summaryText = await summarizeMessages(toSummarize, controller.signal);
        const summaryMsg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          text: summaryText,
          createdAt: Date.now(),
          isSummary: true,
        };
        setMessagesForSession(sessionId)([summaryMsg, ...toKeep]);
        effectivePriorMessages = [summaryMsg, ...toKeep];
      } catch (sumErr) {
        if ((sumErr as { name?: string })?.name === 'AbortError') {
          setLoading(false);
          return;
        }
        // Summarization failed — continue with full history
      }
    }

    addUserMessageToSession(sessionId, userMsg);

    try {
      const rawPrompt = activeAgent?.instructions || "You are a helpful document analysis assistant.";
      const systemPrompt = activeAgent?.variables
        ? applyVariables(rawPrompt, activeAgent.variables)
        : rawPrompt;
      const provider = getAIProvider();
      const setMsgs = setMessagesForSession(sessionId);
      await provider.sendMessage(systemPrompt, effectivePriorMessages, userMsg, setMsgs, {
        signal: controller.signal,
        temperature: activeAgent?.temperature,
        maxTokens: activeAgent?.maxTokens,
        topP: activeAgent?.topP,
      });
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      const setMsgs = setMessagesForSession(sessionId);
      setMsgs((m) => {
        const last = m.at(-1);
        if (last?.role === "assistant" && last.text === "") {
          return [
            ...m.slice(0, -1),
            { ...last, text: "An error occurred. Please try again." }
          ];
        }
        return [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant" as const,
            text: "An error occurred. Please try again.",
            createdAt: Date.now()
          }
        ];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
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
    handleSuggestion
  };
}

