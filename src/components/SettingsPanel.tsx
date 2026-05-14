import { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAgentStore } from '../store/agentStore';
import { Toggle } from './Toggle';
import styles from './SettingsPanel.module.css';

function InfoTooltip({ text }: { text: string }) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);

  const show = () => {
    if (!iconRef.current) return;
    const r = iconRef.current.getBoundingClientRect();
    setCoords({ top: r.top - 8, left: r.left + r.width / 2 });
  };

  const hide = () => setCoords(null);

  return (
    <>
      <span ref={iconRef} className={styles.infoIcon} onMouseEnter={show} onMouseLeave={hide}>
        ⓘ
      </span>
      {coords &&
        ReactDOM.createPortal(
          <div className={styles.tooltipPortal} style={{ top: coords.top, left: coords.left }}>
            {text}
            <span className={styles.tooltipArrow} />
          </div>,
          document.body
        )}
    </>
  );
}

export function SettingsPanel() {
  const { getToken } = useAuth();
  const agents = useAgentStore((s) => s.agents);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const patchAgentLocally = useAgentStore((s) => s.patchAgentLocally);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const activeAgent = agents.find((a) => a.id === activeAgentId);

  if (!activeAgent) return null;

  const sync = (patch: Parameters<typeof updateAgent>[1]) =>
    void updateAgent(activeAgentId, patch, getToken);

  return (
    <div>
      <div className={styles.section}>
        <div className={styles.row}>
          <div className={styles.labelTitle}>
            Advanced Control{' '}
            <span className={styles.labelHint}>ⓘ</span>
          </div>
          <Toggle
            on={activeAgent.advancedControl}
            onChange={(v) => sync({ advancedControl: v })}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>File Search</div>
        <div className={styles.row} style={{ marginBottom: '10px' }}>
          <label className={styles.labelRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={activeAgent.enableFileSearch}
              onChange={(e) => sync({ enableFileSearch: e.target.checked })}
            />
            Enable File Search
            <span style={{ fontSize: '11px', color: '#aaa' }}>ⓘ</span>
          </label>
        </div>
        <button type="button" className={styles.outlineBtn}>
          📎 Upload for File Search
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>MCP Servers</div>
        <button type="button" className={styles.outlineBtn}>
          ＋ Add MCP Server Tools
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Tools + Actions</div>
        <div className={styles.halfBtnRow}>
          <button type="button" className={styles.halfBtn}>＋ Add Tools</button>
          <button type="button" className={styles.halfBtn}>⚡ Add Actions</button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Model Parameters</div>

        <div className={styles.fieldLabel}>
          Temperature{' '}
          <span className={styles.paramValue}>{activeAgent.temperature.toFixed(1)}</span>
          <InfoTooltip text="Controls how creative the AI's responses are. Low (0.0) gives safe, predictable answers. High (1.0) gives more imaginative but less consistent replies." />
        </div>
        <input
          type="range" min="0" max="1" step="0.1"
          value={activeAgent.temperature}
          onChange={(e) => patchAgentLocally(activeAgentId, { temperature: parseFloat(e.target.value) })}
          onMouseUp={() => sync({ temperature: activeAgent.temperature })}
          onTouchEnd={() => sync({ temperature: activeAgent.temperature })}
          className={styles.rangeInput}
        />
        <div className={styles.rangeLabels}>
          <span>Precise</span><span>Creative</span>
        </div>

        <div className={styles.fieldLabel}>
          Max Tokens{' '}
          <span className={styles.paramValue}>{activeAgent.maxTokens}</span>
          <InfoTooltip text="Sets the maximum length of the AI's reply. One token is roughly one word. Increase this for longer, more detailed responses; decrease it to keep answers brief." />
        </div>
        <input
          type="range" min="256" max="4096" step="256"
          value={activeAgent.maxTokens}
          onChange={(e) => patchAgentLocally(activeAgentId, { maxTokens: parseInt(e.target.value, 10) })}
          onMouseUp={() => sync({ maxTokens: activeAgent.maxTokens })}
          onTouchEnd={() => sync({ maxTokens: activeAgent.maxTokens })}
          className={styles.rangeInput}
        />
        <div className={styles.rangeLabels}>
          <span>256</span><span>4096</span>
        </div>

        <div className={styles.fieldLabel}>
          Top P{' '}
          <span className={styles.paramValue}>{activeAgent.topP.toFixed(2)}</span>
          <InfoTooltip text="Controls the variety of words the AI considers when forming a reply. Lower values stick to the most likely words; higher values allow a broader, more diverse vocabulary." />
        </div>
        <input
          type="range" min="0.1" max="1" step="0.05"
          value={activeAgent.topP}
          onChange={(e) => patchAgentLocally(activeAgentId, { topP: parseFloat(e.target.value) })}
          onMouseUp={() => sync({ topP: activeAgent.topP })}
          onTouchEnd={() => sync({ topP: activeAgent.topP })}
          className={styles.rangeInput}
        />
        <div className={styles.rangeLabels}>
          <span>Focused</span><span>Diverse</span>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Support Contact</div>
        <div className={styles.fieldLabel}>Name</div>
        <input
          className={styles.fieldInput}
          placeholder="Support contact name"
          value={activeAgent.supportName}
          onChange={(e) => patchAgentLocally(activeAgentId, { supportName: e.target.value })}
          onBlur={() => sync({ supportName: activeAgent.supportName })}
        />
        <div className={styles.fieldLabel}>Email</div>
        <input
          className={styles.fieldInput}
          placeholder="support@example.com"
          type="email"
          value={activeAgent.supportEmail}
          onChange={(e) => patchAgentLocally(activeAgentId, { supportEmail: e.target.value })}
          onBlur={() => sync({ supportEmail: activeAgent.supportEmail })}
        />
      </div>
    </div>
  );
}
