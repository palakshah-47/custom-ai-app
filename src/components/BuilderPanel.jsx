import { styles } from "../styles/appStyles";
import { Toggle } from "./Toggle";

export function BuilderPanel({
  agentName,
  setAgentName,
  agentDesc,
  setAgentDesc,
  category,
  setCategory,
  instructions,
  setInstructions,
  enableArtifacts,
  setEnableArtifacts,
  enableHighQuality,
  setEnableHighQuality,
  advancedControl,
  setAdvancedControl,
}) {
  return (
    <div>
      <select style={styles.agentDropdown} value={agentName} onChange={(e) => setAgentName(e.target.value)}>
        <option>Analyze a Document</option>
        <option>Data Insights Agent</option>
        <option>Email Composer</option>
      </select>

      <div style={styles.createAgentRow}>
        <button type="button" style={styles.createBtn}>
          ＋ Create New Agent
        </button>
        <button type="button" style={styles.selectBtn}>
          Select
        </button>
      </div>

      <div style={styles.avatarCircle}>＋</div>

      <div style={styles.fieldLabel}>Name *</div>
      <input style={styles.fieldInput} value={agentName} onChange={(e) => setAgentName(e.target.value)} />
      <div style={styles.agentIdText}>agent_1kvRvkNOz7pSOHiKWeJVV</div>

      <div style={styles.fieldLabel}>Description</div>
      <input style={styles.fieldInput} value={agentDesc} onChange={(e) => setAgentDesc(e.target.value)} />

      <div style={styles.fieldLabel}>Category *</div>
      <select style={{ ...styles.fieldInput, cursor: "pointer" }} value={category} onChange={(e) => setCategory(e.target.value)}>
        <option>Others</option>
        <option>Finance</option>
        <option>Legal</option>
        <option>HR</option>
        <option>Sales</option>
        <option>Marketing</option>
      </select>

      <div style={{ ...styles.row, marginBottom: "4px" }}>
        <div style={styles.fieldLabel}>Instructions</div>
        <button
          type="button"
          style={{
            fontSize: "11px",
            background: "none",
            border: "1px solid #ddd",
            borderRadius: "6px",
            padding: "2px 8px",
            cursor: "pointer",
            color: "#666",
          }}
        >
          ⚙ Variables
        </button>
      </div>
      <textarea style={styles.textarea} value={instructions} onChange={(e) => setInstructions(e.target.value)} />

      <div style={styles.fieldLabel}>Model *</div>
      <div style={styles.modelDisplay}>
        <span style={styles.modelIcon}>🤖</span>
        <span style={{ flex: 1, fontSize: "11px", color: "#555" }}>global.anthropic.claude-sonnet-4-5-20250929-v1:0</span>
      </div>

      <div style={{ ...styles.sectionLabel, marginTop: "8px" }}>Capabilities</div>

      <div style={{ fontSize: "11px", fontWeight: 600, color: "#333", marginBottom: "6px" }}>Artifacts</div>

      <div style={styles.row}>
        <div style={styles.labelRow}>
          <span style={{ fontSize: "11px", color: "#555" }}>Enable Artifacts</span>
          <span style={{ fontSize: "11px", color: "#aaa" }}>ⓘ</span>
        </div>
        <Toggle on={enableArtifacts} onChange={setEnableArtifacts} />
      </div>

      <div style={styles.row}>
        <div style={styles.labelRow}>
          <span style={{ fontSize: "11px", color: "#555" }}>High-Quality UI Kit</span>
          <span style={{ fontSize: "11px", color: "#aaa" }}>ⓘ</span>
        </div>
        <Toggle on={enableHighQuality} onChange={setEnableHighQuality} />
      </div>

      <div style={styles.row}>
        <div style={styles.labelRow}>
          <span style={{ fontSize: "11px", color: "#555" }}>Advanced Control</span>
          <span style={{ fontSize: "11px", color: "#aaa" }}>ⓘ</span>
        </div>
        <Toggle on={advancedControl} onChange={setAdvancedControl} />
      </div>
    </div>
  );
}
