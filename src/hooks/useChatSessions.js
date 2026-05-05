import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { buildOllamaMessages, consumeOllamaChatStream, OLLAMA_MODEL } from "./ollamaChat";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptySession() {
  return {
    id: newId(),
    title: "New chat",
    titleEdited: false,
    messages: [],
    archived: false,
    bookmarked: false,
    createdAt: Date.now(),
  };
}

function titleFromFirstMessage(text) {
  const line = text.trim().split(/\r?\n/)[0] ?? "";
  const t = line.replace(/\s+/g, " ").trim();
  if (!t) return "New chat";
  return t.length > 80 ? `${t.slice(0, 80)}…` : t;
}

function formatChatForShare(session) {
  const lines = session.messages.map((m) => {
    const who = m.role === "user" ? "User" : "Assistant";
    return `**${who}:**\n${m.text}`;
  });
  return `# ${session.title}\n\n${lines.join("\n\n")}`;
}

function sessionVisibleInMainList(s, bookmarksOnly) {
  if (s.archived) return false;
  if (bookmarksOnly && !s.bookmarked) return false;
  return true;
}

function firstVisibleInList(list, bookmarksOnly) {
  return (
    list.find((s) => sessionVisibleInMainList(s, bookmarksOnly))?.id ??
    list.find((s) => !s.archived)?.id ??
    list[0]?.id ??
    null
  );
}

export function useChatSessions(instructions) {
  const firstSession = useMemo(() => createEmptySession(), []);
  const [sessions, setSessions] = useState([firstSession]);
  const [activeSessionId, setActiveSessionId] = useState(firstSession.id);
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const activeSessionIdRef = useRef(activeSessionId);
  activeSessionIdRef.current = activeSessionId;
  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];
  const messages = activeSession?.messages ?? [];

  const setMessagesForSession = useCallback((sessionId) => {
    return (updateFn) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const nextMsgs = typeof updateFn === "function" ? updateFn(s.messages) : updateFn;
          return { ...s, messages: nextMsgs };
        })
      );
    };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, activeSessionId]);

  const newChat = useCallback(() => {
    const s = createEmptySession();
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s.id);
    setMessage("");
    setBookmarksOnly(false);
  }, []);

  const showAllChats = useCallback(() => {
    setBookmarksOnly(false);
  }, []);

  const toggleBookmarksFilter = useCallback(() => {
    setBookmarksOnly((b) => {
      const next = !b;
      if (next) {
        queueMicrotask(() => {
          const list = sessionsRef.current;
          const cur = activeSessionIdRef.current;
          const active = list.find((x) => x.id === cur);
          if (active && (!active.bookmarked || active.archived)) {
            const pick = list.find((s) => s.bookmarked && !s.archived);
            if (pick) setActiveSessionId(pick.id);
          }
        });
      }
      return next;
    });
  }, []);

  const selectSession = useCallback((id) => {
    setActiveSessionId(id);
    setMessage("");
  }, []);

  const renameSession = useCallback((id, title) => {
    const trimmed = (title ?? "").trim();
    if (!trimmed) return;
    setSessions((prev) => prev.map((x) => (x.id === id ? { ...x, title: trimmed, titleEdited: true } : x)));
  }, []);

  const deleteSession = useCallback(
    (id) => {
      if (!window.confirm("Delete this chat? This cannot be undone.")) return;
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (next.length === 0) {
          const fresh = createEmptySession();
          queueMicrotask(() => setActiveSessionId(fresh.id));
          return [fresh];
        }
        if (activeSessionIdRef.current === id) {
          const pick = firstVisibleInList(next, bookmarksOnly) ?? next[0].id;
          queueMicrotask(() => setActiveSessionId(pick));
        }
        return next;
      });
    },
    [bookmarksOnly]
  );

  const archiveSession = useCallback(
    (id) => {
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, archived: true } : s));
        if (activeSessionIdRef.current === id) {
          const pick = firstVisibleInList(next, bookmarksOnly);
          if (pick) queueMicrotask(() => setActiveSessionId(pick));
          else {
            const fresh = createEmptySession();
            queueMicrotask(() => setActiveSessionId(fresh.id));
            return [fresh, ...next];
          }
        }
        return next;
      });
    },
    [bookmarksOnly]
  );

  const unarchiveSession = useCallback((id) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, archived: false } : s)));
  }, []);

  const toggleSessionBookmark = useCallback((id) => {
    setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, bookmarked: !s.bookmarked } : s)));
  }, []);

  const shareSession = useCallback(
    async (id) => {
      const s = sessions.find((x) => x.id === id);
      if (!s) return;
      const text = formatChatForShare(s);
      try {
        await navigator.clipboard.writeText(text);
        window.alert("Chat copied to clipboard. You can paste it into email or a doc.");
      } catch {
        window.prompt("Copy this text:", text);
      }
    },
    [sessions]
  );

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    const userMsg = message.trim();
    const sessionId = activeSessionIdRef.current;
    const priorMessages = messages;
    setMessage("");

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        let title = s.title;
        if (!s.titleEdited && s.messages.length === 0) {
          title = titleFromFirstMessage(userMsg);
        }
        return {
          ...s,
          title,
          messages: [...s.messages, { role: "user", text: userMsg }],
        };
      })
    );
    setLoading(true);
    try {
      const systemPrompt = instructions || "You are a helpful document analysis assistant.";
      const res = await fetch("/api/ollama/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: true,
          messages: buildOllamaMessages(systemPrompt, priorMessages, userMsg),
          options: { num_predict: 1000 },
        }),
      });

      const setMsgs = setMessagesForSession(sessionId);

      if (!res.ok) {
        const text = await res.text();
        let errMsg = `Ollama request failed (${res.status}). Is Ollama running? Set OLLAMA_HOST and run ollama pull ${OLLAMA_MODEL}.`;
        try {
          const data = text ? JSON.parse(text) : {};
          const errRaw = data?.error;
          errMsg =
            (typeof errRaw === "string" ? errRaw : errRaw?.message) ||
            data?.message ||
            text ||
            errMsg;
        } catch {
          if (text) errMsg = text;
        }
        setMsgs((m) => [...m, { role: "assistant", text: String(errMsg) }]);
        return;
      }

      setMsgs((m) => [...m, { role: "assistant", text: "" }]);
      await consumeOllamaChatStream(res, setMsgs);
    } catch {
      const setMsgs = setMessagesForSession(sessionId);
      setMsgs((m) => {
        const last = m[m.length - 1];
        if (last?.role === "assistant" && last.text === "") {
          return [...m.slice(0, -1), { role: "assistant", text: "An error occurred. Please try again." }];
        }
        return [...m, { role: "assistant", text: "An error occurred. Please try again." }];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text) => {
    setMessage(text);
    textareaRef.current?.focus();
  };

  const hasMessages = messages.length > 0;

  const mainListSessions = sessions.filter((s) => sessionVisibleInMainList(s, bookmarksOnly));
  const archivedSessions = sessions.filter((s) => s.archived);

  return {
    sessions,
    mainListSessions,
    archivedSessions,
    activeSessionId,
    activeSession,
    bookmarksOnly,
    newChat,
    showAllChats,
    toggleBookmarksFilter,
    selectSession,
    renameSession,
    deleteSession,
    archiveSession,
    unarchiveSession,
    shareSession,
    toggleSessionBookmark,
    message,
    setMessage,
    messages,
    loading,
    textareaRef,
    messagesEndRef,
    handleSend,
    handleKeyDown,
    handleSuggestion,
    hasMessages,
  };
}
