import styles from "./TopBanner.module.css";

interface TopBannerProps {
  onDismiss: () => void;
}

export function TopBanner({ onDismiss }: TopBannerProps) {
  return (
    <div className={styles.topBanner}>
      <span>✨</span>
      <span>🌐</span>
      <span>
        🚀 <strong>Web Search Now Live</strong> — Ask anything and get answers
        with <strong>real-time web information!</strong>
      </span>
      <button type="button" className={styles.bannerClose} onClick={onDismiss}>
        ×
      </button>
    </div>
  );
}

