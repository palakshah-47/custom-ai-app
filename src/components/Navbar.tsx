import { useAgentStore } from '../store/agentStore';
import styles from './Navbar.module.css';

export function Navbar() {
  const agents = useAgentStore((s) => s.agents);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const activeAgent = agents.find((a) => a.id === activeAgentId);

  return (
    <div className={styles.navbar}>
      <div className={styles.navLogo}>
        DomusA<span className={styles.logoStar}>★</span>
      </div>
      <div className={styles.navBreadcrumb}>
        <div className={styles.breadcrumbPill}>
          <span>📋</span> {activeAgent?.name ?? 'AgentAI'}
        </div>
      </div>
      <div className={styles.navRight}>
        <button type="button" className={styles.navIcon}>◎</button>
        <button type="button" className={styles.navIcon}>⚙</button>
      </div>
    </div>
  );
}
