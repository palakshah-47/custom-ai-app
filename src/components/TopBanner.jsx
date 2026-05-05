import { styles } from "../styles/appStyles";

export function TopBanner({ onDismiss }) {
  return (
    <div style={styles.topBanner}>
      <span>✨</span>
      <span>🌐</span>
      <span>
        🚀 <strong>Web Search Now Live</strong> — Ask DomusAI anything and get answers with{" "}
        <strong>real-time web information!</strong>
      </span>
      <button type="button" style={styles.bannerClose} onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}
