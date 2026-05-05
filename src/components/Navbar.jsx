import { styles } from "../styles/appStyles";

export function Navbar({ agentName }) {
  return (
    <div style={styles.navbar}>
      <div style={styles.navLogo}>
        DomusA<span style={styles.logoStar}>★</span>
      </div>
      <div style={styles.navBreadcrumb}>
        <div style={styles.breadcrumbPill}>
          <span>📋</span> {agentName}
        </div>
      </div>
      <div style={styles.navRight}>
        <button type="button" style={styles.navIcon}>
          ◎
        </button>
        <button type="button" style={styles.navIcon}>
          ⚙
        </button>
      </div>
    </div>
  );
}
