const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL || "tinyllama";

export { OLLAMA_MODEL };

export function buildOllamaMessages(systemPrompt, priorMessages, userMsg) {
  const msgs = [{ role: "system", content: systemPrompt }];
  for (const m of priorMessages) {
    msgs.push({
      role: m.role === "user" ? "user" : "assistant",
      content: m.text,
    });
  }
  msgs.push({ role: "user", content: userMsg });
  return msgs;
}

/**
 * Ollama /api/chat with stream:true sends NDJSON: one JSON object per line.
 */
export async function consumeOllamaChatStream(response, setMessages) {
  const reader = response.body?.getReader();
  if (!reader) {
    setMessages((prev) => {
      const next = [...prev];
      const i = next.length - 1;
      if (i >= 0 && next[i].role === "assistant") {
        next[i] = { role: "assistant", text: "No response body from Ollama." };
      }
      return next;
    });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.replace(/\r$/, "").trim();
      if (!trimmed) continue;

      let chunk;
      try {
        chunk = JSON.parse(trimmed);
      } catch {
        continue;
      }

      if (chunk.error) {
        const errText = typeof chunk.error === "string" ? chunk.error : chunk.error?.message || "Ollama stream error";
        setMessages((prev) => {
          const next = [...prev];
          const i = next.length - 1;
          if (i >= 0 && next[i].role === "assistant") {
            next[i] = { role: "assistant", text: errText };
          }
          return next;
        });
        return;
      }

      const piece = chunk.message?.content;
      if (piece) {
        setMessages((prev) => {
          const next = [...prev];
          const i = next.length - 1;
          if (i >= 0 && next[i].role === "assistant") {
            next[i] = { role: "assistant", text: next[i].text + piece };
          }
          return next;
        });
      }
    }
  }

  const tail = buffer.replace(/\r$/, "").trim();
  if (tail) {
    try {
      const chunk = JSON.parse(tail);
      if (chunk.error) {
        const errText = typeof chunk.error === "string" ? chunk.error : chunk.error?.message || "Ollama stream error";
        setMessages((prev) => {
          const next = [...prev];
          const i = next.length - 1;
          if (i >= 0 && next[i].role === "assistant") {
            next[i] = { role: "assistant", text: errText };
          }
          return next;
        });
        return;
      }
      const piece = chunk.message?.content;
      if (piece) {
        setMessages((prev) => {
          const next = [...prev];
          const i = next.length - 1;
          if (i >= 0 && next[i].role === "assistant") {
            next[i] = { role: "assistant", text: next[i].text + piece };
          }
          return next;
        });
      }
    } catch {
      /* ignore */
    }
  }

  setMessages((prev) => {
    const next = [...prev];
    const i = next.length - 1;
    if (i >= 0 && next[i].role === "assistant" && !next[i].text.trim()) {
      next[i] = { role: "assistant", text: "Sorry, I couldn't process that." };
    }
    return next;
  });
}
