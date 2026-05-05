import { styles } from "../styles/appStyles";
import { Toggle } from "./Toggle";

export function SettingsPanel({
  advancedControl,
  setAdvancedControl,
  enableFileSearch,
  setEnableFileSearch,
  supportName,
  setSupportName,
  supportEmail,
  setSupportEmail,
}) {
  return (
    <div>
      <div style={styles.section}>
        <div style={styles.row}>
          <div style={{ fontWeight: 600, fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            Advanced Control <span style={{ fontSize: "11px", color: "#aaa", fontWeight: 400 }}>ⓘ</span>
          </div>
          <Toggle on={advancedControl} onChange={setAdvancedControl} />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>File Search</div>
        <div style={{ ...styles.row, marginBottom: "10px" }}>
          <label style={styles.labelRow}>
            <input
              type="checkbox"
              style={styles.checkbox}
              checked={enableFileSearch}
              onChange={(e) => setEnableFileSearch(e.target.checked)}
            />
            Enable File Search
            <span style={{ fontSize: "11px", color: "#aaa" }}>ⓘ</span>
          </label>
        </div>
        <button type="button" style={styles.outlineBtn}>
          📎 Upload for File Search
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>MCP Servers</div>
        <button type="button" style={styles.outlineBtn}>
          ＋ Add MCP Server Tools
        </button>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Tools + Actions</div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" style={styles.halfBtn}>
            ＋ Add Tools
          </button>
          <button type="button" style={styles.halfBtn}>
            ⚡ Add Actions
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>Support Contact</div>
        <div style={styles.fieldLabel}>Name</div>
        <input
          style={styles.fieldInput}
          placeholder="Support contact name"
          value={supportName}
          onChange={(e) => setSupportName(e.target.value)}
        />
        <div style={styles.fieldLabel}>Email</div>
        <input
          style={styles.fieldInput}
          placeholder="support@example.com"
          value={supportEmail}
          onChange={(e) => setSupportEmail(e.target.value)}
          type="email"
        />
      </div>
    </div>
  );
}
