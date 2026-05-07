import { describe, it, expect, beforeEach } from 'vitest';
import { useAgentStore } from '../store/agentStore';
import type { AgentConfig } from '../types';

const baseAgent: AgentConfig = {
  id: 'default-agent',
  name: 'Analyze a Document',
  description: 'Summarize lengthy documents effortlessly.',
  category: 'Others',
  instructions: 'test instructions',
  enableArtifacts: false,
  enableHighQuality: false,
  advancedControl: false,
  enableFileSearch: true,
  supportName: '',
  supportEmail: '',
};

function resetAgentStore() {
  useAgentStore.setState({
    agents: [baseAgent],
    activeAgentId: 'default-agent',
  });
}

describe('agentStore', () => {
  beforeEach(resetAgentStore);

  it('initial state has one default agent and its id is activeAgentId', () => {
    const state = useAgentStore.getState();
    expect(state.agents).toHaveLength(1);
    expect(state.activeAgentId).toBe('default-agent');
  });

  it('createAgent appends a new agent and switches active to it', () => {
    useAgentStore.getState().createAgent();
    const state = useAgentStore.getState();
    expect(state.agents).toHaveLength(2);
    expect(state.activeAgentId).toBe(state.agents[1]?.id);
  });

  it('updateAgent patches only specified fields, leaving others unchanged', () => {
    useAgentStore.getState().updateAgent('default-agent', { name: 'Updated Name' });
    const agent = useAgentStore.getState().agents.find((a) => a.id === 'default-agent');
    expect(agent?.name).toBe('Updated Name');
    expect(agent?.description).toBe('Summarize lengthy documents effortlessly.');
    expect(agent?.enableArtifacts).toBe(false);
  });

  it('deleteAgent removes the agent and switches to first remaining', () => {
    useAgentStore.getState().createAgent();
    const firstId = useAgentStore.getState().agents[0]?.id ?? '';
    useAgentStore.getState().deleteAgent(firstId);
    const state = useAgentStore.getState();
    expect(state.agents).toHaveLength(1);
    expect(state.agents.every((a) => a.id !== firstId)).toBe(true);
    expect(state.activeAgentId).toBe(state.agents[0]?.id);
  });

  it('deleteAgent on last agent creates a fresh default', () => {
    useAgentStore.getState().deleteAgent('default-agent');
    const state = useAgentStore.getState();
    expect(state.agents).toHaveLength(1);
    expect(state.agents[0]?.id).not.toBe('default-agent');
  });

  it('selectAgent sets activeAgentId', () => {
    useAgentStore.getState().createAgent();
    const newId = useAgentStore.getState().agents[1]?.id ?? '';
    useAgentStore.getState().selectAgent('default-agent');
    expect(useAgentStore.getState().activeAgentId).toBe('default-agent');
    useAgentStore.getState().selectAgent(newId);
    expect(useAgentStore.getState().activeAgentId).toBe(newId);
  });
});
