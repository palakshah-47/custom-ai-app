import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useAgentStore } from '../store/agentStore';
import { Toggle } from './Toggle';
import type { AgentCategory } from '../types';
import styles from './BuilderPanel.module.css';

const CATEGORIES: AgentCategory[] = ['Others', 'Finance', 'Legal', 'HR', 'Sales', 'Marketing'];

function parseVariables(instructions: string): string[] {
  const matches = instructions.matchAll(/\{\{(\w+)\}\}/g);
  return [...new Set([...matches].map((m) => m[1] ?? '').filter(Boolean))];
}

export function BuilderPanel() {
  const { getToken } = useAuth();
  const [showVariables, setShowVariables] = useState(false);
  const agents = useAgentStore((s) => s.agents);
  const activeAgentId = useAgentStore((s) => s.activeAgentId);
  const patchAgentLocally = useAgentStore((s) => s.patchAgentLocally);
  const updateAgent = useAgentStore((s) => s.updateAgent);
  const createAgent = useAgentStore((s) => s.createAgent);
  const selectAgent = useAgentStore((s) => s.selectAgent);
  const activeAgent = agents.find((a) => a.id === activeAgentId);

  if (!activeAgent) return null;

  const detectedVars = parseVariables(activeAgent.instructions);

  const sync = (patch: Parameters<typeof updateAgent>[1]) =>
    void updateAgent(activeAgentId, patch, getToken);

  return (
    <div>
      <select
        className={styles.agentDropdown}
        value={activeAgentId}
        onChange={(e) => selectAgent(e.target.value)}
      >
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>

      <div className={styles.createAgentRow}>
        <button type="button" className={styles.createBtn} onClick={() => void createAgent(getToken)}>
          ＋ Create New Agent
        </button>
        <button type="button" className={styles.selectBtn}>
          Select
        </button>
      </div>

      <div className={styles.avatarCircle}>＋</div>

      <div className={styles.fieldLabel}>Name *</div>
      <input
        className={styles.fieldInput}
        value={activeAgent.name}
        onChange={(e) => patchAgentLocally(activeAgentId, { name: e.target.value })}
        onBlur={() => sync({ name: activeAgent.name })}
      />
      <div className={styles.agentIdText}>agent_1kvRvkNOz7pSOHiKWeJVV</div>

      <div className={styles.fieldLabel}>Description</div>
      <input
        className={styles.fieldInput}
        value={activeAgent.description}
        onChange={(e) => patchAgentLocally(activeAgentId, { description: e.target.value })}
        onBlur={() => sync({ description: activeAgent.description })}
      />

      <div className={styles.fieldLabel}>Category *</div>
      <select
        className={styles.fieldInput}
        style={{ cursor: 'pointer' }}
        value={activeAgent.category}
        onChange={(e) => sync({ category: e.target.value as AgentCategory })}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <div className={styles.instructionsHeader}>
        <div className={styles.fieldLabel}>Instructions</div>
        <button
          type="button"
          className={`${styles.variablesBtn} ${showVariables ? styles.variablesBtnActive : ''}`}
          onClick={() => setShowVariables((v) => !v)}
          title="Define values for {{variable}} placeholders in your instructions"
        >
          ⚙ Variables {detectedVars.length > 0 && `(${detectedVars.length})`}
        </button>
      </div>
      <textarea
        className={styles.textarea}
        value={activeAgent.instructions}
        onChange={(e) => patchAgentLocally(activeAgentId, { instructions: e.target.value })}
        onBlur={() => sync({ instructions: activeAgent.instructions })}
      />

      {showVariables && (
        <div className={styles.variablesPanel}>
          <div className={styles.variablesPanelHint}>
            Use <code>{'{{variable_name}}'}</code> in your instructions above. Set default values here.
          </div>
          {detectedVars.length === 0 ? (
            <div className={styles.variablesPanelEmpty}>
              No variables found. Add <code>{'{{variable}}'}</code> to your instructions.
            </div>
          ) : (
            detectedVars.map((name) => (
              <div key={name} className={styles.variableRow}>
                <span className={styles.variableName}>{`{{${name}}}`}</span>
                <input
                  className={styles.variableInput}
                  placeholder={`Value for ${name}`}
                  value={activeAgent.variables[name] ?? ''}
                  onChange={(e) =>
                    patchAgentLocally(activeAgentId, {
                      variables: { ...activeAgent.variables, [name]: e.target.value },
                    })
                  }
                  onBlur={() => sync({ variables: activeAgent.variables })}
                />
              </div>
            ))
          )}
        </div>
      )}

      <div className={styles.fieldLabel}>Model *</div>
      <div className={styles.modelDisplay}>
        <span>🤖</span>
        <span style={{ flex: 1, fontSize: '11px', color: '#555' }}>
          OpenAI {process.env.OPENAI_MODEL ?? 'gpt-4o-mini'}
        </span>
      </div>

      <div className={styles.sectionLabel}>Capabilities</div>
      <div className={styles.capabilityGroup}>Artifacts</div>

      <div className={styles.row}>
        <div className={styles.labelRow}>
          <span>Enable Artifacts</span>
          <span style={{ color: '#aaa' }}>ⓘ</span>
        </div>
        <Toggle
          on={activeAgent.enableArtifacts}
          onChange={(v) => sync({ enableArtifacts: v })}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.labelRow}>
          <span>High-Quality UI Kit</span>
          <span style={{ color: '#aaa' }}>ⓘ</span>
        </div>
        <Toggle
          on={activeAgent.enableHighQuality}
          onChange={(v) => sync({ enableHighQuality: v })}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.labelRow}>
          <span>Advanced Control</span>
          <span style={{ color: '#aaa' }}>ⓘ</span>
        </div>
        <Toggle
          on={activeAgent.advancedControl}
          onChange={(v) => sync({ advancedControl: v })}
        />
      </div>
    </div>
  );
}
