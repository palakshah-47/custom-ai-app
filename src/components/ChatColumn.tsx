import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@clerk/clerk-react";
import { useChatStore } from "../store/chatStore";
import { useAgentStore } from "../store/agentStore";
import { useSendMessage } from "../hooks/useSendMessage";
import { SUGGESTIONS } from "../constants/appConstants";
import styles from "./ChatColumn.module.css";

export function ChatColumn() {
  const { getToken } = useAuth();
  const [inputFocused, setInputFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const message = useChatStore((s) => s.message);
  const setMessage = useChatStore((s) => s.setMessage);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const sessions = useChatStore((s) => s.sessions);
  const rateMessage = useChatStore((s) => s.rateMessage);
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages ?? [];
  const hasMessages = messages.length > 0;

  const agents = useAgentStore((s) => s.agents);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const activeAgent = agents.find((a) => a.id === activeAgentId);
  const agentName = activeAgent?.name ?? "AgentAI";
  const agentDesc = activeAgent?.description ?? "";

  const {
    textareaRef,
    messagesEndRef,
    loading,
    handleSend,
    stopGeneration,
    handleKeyDown,
    handleSuggestion
  } = useSendMessage();

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content !== "string") return;
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      const codeExts = [
        "js",
        "ts",
        "tsx",
        "jsx",
        "py",
        "json",
        "css",
        "html",
        "md",
        "txt",
        "csv"
      ];
      const formatted = codeExts.includes(ext)
        ? `\`\`\`${ext}\n${content}\n\`\`\`\n\n`
        : `${content}\n\n`;
      setMessage(formatted + message);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.main}>
      <div className={styles.chatArea}>
        {!hasMessages && (
          <div className={styles.emptyState}>
            <div className={styles.chatTitle}>
              <span className={styles.chatTitleStar}>✱</span>
              <span className={styles.chatTitleText}>{agentName}</span>
            </div>
            <p className={styles.chatSubtitle}>{agentDesc}</p>
          </div>
        )}
        {hasMessages && (
          <div className={styles.messagesContainer}>
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className={styles.msgUser}>
                  {m.text}
                </div>
              ) : (
                <div key={m.id} className={styles.assistantRow}>
                  <div className={[styles.msgAssistant, m.isSummary ? styles.msgSummary : ""].join(" ").trim()}>
                    {m.isSummary && (
                      <div className={styles.summaryLabel}>📝 Context summary</div>
                    )}
                    <div className="chat-md">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                    </div>
                    {m.tokens !== undefined && (
                      <div className={styles.tokenCount}>📊 {m.tokens.toLocaleString()} tokens</div>
                    )}
                  </div>
                  {!m.isSummary && (
                    <div className={styles.ratingBtns}>
                      <button
                        type="button"
                        className={`${styles.ratingBtn} ${m.rating === "up" ? styles.ratingBtnUp : ""}`}
                        title="Good response"
                        onClick={() => void rateMessage(activeSessionId, m.id, "up", getToken)}
                      >👍</button>
                      <button
                        type="button"
                        className={`${styles.ratingBtn} ${m.rating === "down" ? styles.ratingBtnDown : ""}`}
                        title="Bad response"
                        onClick={() => void rateMessage(activeSessionId, m.id, "down", getToken)}
                      >👎</button>
                    </div>
                  )}
                </div>
              )
            )}
            {loading && (
              <div className={`${styles.msgAssistant} ${styles.msgThinking}`}>
                Thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className={styles.inputArea}>
        <div className={styles.suggestRow}>
          <span className={styles.tryLabel}>✨ Try:</span>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              type="button"
              className={styles.suggestChip}
              onClick={() => handleSuggestion(s.text)}
            >
              <span className={styles.chipIcon}>{s.icon}</span>
              {s.text.length > 38 ? s.text.slice(0, 38) + "…" : s.text}
            </button>
          ))}
        </div>

        <div
          className={`${styles.inputBox} ${inputFocused ? styles.inputBoxFocused : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className={styles.fileInput}
            onChange={handleFileChange}
            accept=".txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.py,.css,.html"
          />
          <button
            type="button"
            className={styles.iconBtn}
            title="Attach file"
            onClick={handleFileAttach}
          >
            📎
          </button>
          <textarea
            ref={textareaRef}
            className={styles.inputEl}
            placeholder={`Message ${agentName}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            rows={1}
          />
          <button type="button" className={styles.iconBtn} title="Voice input">
            🎙️
          </button>
          <button
            type="button"
            className={`${styles.sendBtn} ${loading ? styles.sendBtnStop : message.trim() ? styles.sendBtnActive : ""}`}
            onClick={loading ? stopGeneration : handleSend}
            disabled={!loading && !message.trim()}
            title={loading ? "Stop generation" : "Send message"}
          >
            {loading ? "■" : "➤"}
          </button>
        </div>

        <p className={styles.disclaimer}>
          <span className={styles.disclaimerAccent}>DISCLAIMER:</span> You are
          solely responsible for verifying all AI-generated content. This tool
          provides information that may contain errors or inaccuracies.
        </p>
      </div>
    </div>
  );
}

