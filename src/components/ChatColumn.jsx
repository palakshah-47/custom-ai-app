import { TEAL, styles } from "../styles/appStyles";
import { SUGGESTIONS } from "../constants/appConstants";

export function ChatColumn({
  agentName,
  agentDesc,
  message,
  setMessage,
  messages,
  loading,
  inputFocused,
  setInputFocused,
  textareaRef,
  messagesEndRef,
  handleSend,
  handleKeyDown,
  handleSuggestion,
  hasMessages,
}) {
  return (
    <div style={styles.main}>
      <div style={styles.chatArea}>
        {!hasMessages && (
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={styles.chatTitle}>
              <span style={styles.chatTitleStar}>✱</span>
              <span style={styles.chatTitleText}>{agentName}</span>
            </div>
            <p style={styles.chatSubtitle}>{agentDesc}</p>
          </div>
        )}
        {hasMessages && (
          <div style={styles.messagesContainer}>
            {messages.map((m, i) => (
              <div key={i} style={m.role === "user" ? styles.msgUser : styles.msgAssistant}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ ...styles.msgAssistant, color: "#aaa", fontStyle: "italic" }}>Thinking…</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div style={styles.inputArea}>
        <div style={styles.suggestRow}>
          <span style={styles.tryLabel}>✨ Try:</span>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} type="button" style={styles.suggestChip} onClick={() => handleSuggestion(s.text)}>
              <span style={styles.chipIcon}>{s.icon}</span>
              {s.text.length > 38 ? s.text.slice(0, 38) + "…" : s.text}
            </button>
          ))}
        </div>
        <div style={{ ...styles.inputBox, ...(inputFocused ? styles.inputBoxFocused : {}) }}>
          <button type="button" style={styles.iconBtn} title="Attach file">
            📎
          </button>
          <textarea
            ref={textareaRef}
            style={styles.inputEl}
            placeholder={`Message ${agentName}`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            rows={1}
          />
          <button type="button" style={styles.iconBtn} title="Voice input">
            🎙️
          </button>
          <button
            type="button"
            style={{
              ...styles.sendBtn,
              background: message.trim() ? TEAL : "#e5e3df",
              color: message.trim() ? "#fff" : "#aaa",
            }}
            onClick={handleSend}
            disabled={!message.trim() || loading}
          >
            ➤
          </button>
        </div>
        <p style={styles.disclaimer}>
          <span style={styles.disclaimerAccent}>DISCLAIMER:</span> You are solely responsible for verifying all AI-generated
          content. This tool provides information that may contain errors or inaccuracies.
        </p>
      </div>
    </div>
  );
}
