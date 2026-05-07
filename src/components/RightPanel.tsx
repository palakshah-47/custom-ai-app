import { useState } from 'react';
import { BuilderPanel } from './BuilderPanel';
import { SettingsPanel } from './SettingsPanel';
import { MENU_ITEMS } from '../constants/appConstants';
import styles from './RightPanel.module.css';

interface RightPanelProps {
  panelView: 'builder' | 'settings';
  setPanelView: (view: 'builder' | 'settings') => void;
}

export function RightPanel({ panelView, setPanelView }: RightPanelProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={styles.rightPanel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelIcon}>🤖</span>
        <button
          type="button"
          className={`${styles.panelTab} ${panelView === 'builder' ? styles.panelTabActive : styles.panelTabInactive}`}
          onClick={() => setPanelView('builder')}
        >
          Agent Builder
        </button>
        <button
          type="button"
          className={`${styles.panelTab} ${panelView === 'settings' ? styles.panelTabActive : styles.panelTabInactive}`}
          onClick={() => setPanelView('settings')}
        >
          Settings
        </button>
      </div>

      <div className={styles.panelBody}>
        {panelView === 'builder' ? <BuilderPanel /> : <SettingsPanel />}
      </div>

      <div className={styles.panelFooter}>
        {panelView === 'settings' ? (
          <>
            <div className={styles.footerTopRow}>
              <button type="button" className={styles.outlineBtn}>⚙ Advanced</button>
              <button type="button" className={styles.outlineBtn}>🕐 Version</button>
            </div>
            <div className={styles.footerBtnRow}>
              <button type="button" className={styles.dangerBtn}>🗑</button>
              <button type="button" className={styles.ghostBtn}>↗ 1</button>
              <button type="button" className={styles.ghostBtn}>⧉</button>
              <button type="button" className={styles.saveBtn} onClick={handleSave}>
                {saved ? 'Saved ✓' : 'Save'}
              </button>
            </div>
            <div className={styles.menuSection}>
              <ul className={styles.menuList}>
                {MENU_ITEMS.map((item) => (
                  <li key={item.label} className={styles.menuItem}>
                    <span>{item.icon}</span> {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div className={styles.footerBtnRow}>
            <button type="button" className={styles.dangerBtn}>🗑</button>
            <button type="button" className={styles.ghostBtn}>↗ 1</button>
            <button type="button" className={styles.ghostBtn}>⧉</button>
            <button type="button" className={styles.saveBtn} onClick={handleSave}>
              {saved ? 'Saved ✓' : 'Save'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
