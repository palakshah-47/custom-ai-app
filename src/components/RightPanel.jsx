import { styles } from "../styles/appStyles";
import { MENU_ITEMS } from "../constants/appConstants";
import { BuilderPanel } from "./BuilderPanel";
import { SettingsPanel } from "./SettingsPanel";

export function RightPanel({
  panelView,
  setPanelView,
  builderProps,
  settingsProps,
}) {
  return (
    <div style={styles.rightPanel}>
      <div style={styles.panelHeader}>
        <span style={{ fontSize: "14px", marginRight: "4px" }}>🤖</span>
        <button
          type="button"
          style={{
            ...styles.panelTab,
            ...(panelView === "builder" ? styles.panelTabActive : styles.panelTabInactive),
          }}
          onClick={() => setPanelView("builder")}
        >
          Agent Builder
        </button>
        <button
          type="button"
          style={{
            ...styles.panelTab,
            ...(panelView === "settings" ? styles.panelTabActive : styles.panelTabInactive),
          }}
          onClick={() => setPanelView("settings")}
        >
          Settings
        </button>
      </div>

      <div style={styles.panelBody}>
        {panelView === "builder" ? <BuilderPanel {...builderProps} /> : <SettingsPanel {...settingsProps} />}
      </div>

      <div style={styles.panelFooter}>
        {panelView === "settings" ? (
          <>
            <div style={{ display: "flex", gap: "8px" }}>
              <button type="button" style={styles.outlineBtn}>
                ⚙ Advanced
              </button>
              <button type="button" style={styles.outlineBtn}>
                🕐 Version
              </button>
            </div>
            <div style={styles.footerBtnRow}>
              <button type="button" style={styles.dangerBtn}>
                🗑
              </button>
              <button type="button" style={styles.ghostBtn}>
                ↗ 1
              </button>
              <button type="button" style={styles.ghostBtn}>
                ⧉
              </button>
              <button type="button" style={styles.saveBtn}>
                Save
              </button>
            </div>
            <div style={{ borderTop: "1px solid #ece9e4", paddingTop: "8px" }}>
              <ul style={styles.menuList}>
                {MENU_ITEMS.map((item) => (
                  <li
                    key={item.label}
                    style={styles.menuItem}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f5f4f1";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{item.icon}</span> {item.label}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <div style={styles.footerBtnRow}>
            <button type="button" style={styles.dangerBtn}>
              🗑
            </button>
            <button type="button" style={styles.ghostBtn}>
              ↗ 1
            </button>
            <button type="button" style={styles.ghostBtn}>
              ⧉
            </button>
            <button type="button" style={styles.saveBtn}>
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
