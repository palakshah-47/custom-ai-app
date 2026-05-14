import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAgentStore } from '../store/agentStore';
import type { AgentConfig } from '../types';

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn((_path: string, body: unknown) =>
    Promise.resolve({ ...(body as object), id: crypto.randomUUID() })
  ),
  apiPatch: vi.fn((_path: string, body: unknown) => Promise.resolve(body)),
  apiDelete: vi.fn(() => Promise.resolve()),
}));

const mockGetToken = () => Promise.resolve('mock-token');

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
  temperature: 0.7,
  maxTokens: 1000,
  topP: 0.9,
  variables: {},
};

function resetAgentStore() {
  useAgentStore.setState({
    agents: [baseAgent],
    activeAgentId: 'default-agent',
    isLoaded: true,
  });
}

describe('agentStore', () => {
  beforeEach(resetAgentStore);

  it('initial state has one default agent and its id is activeAgentId', () => {
    const state = useAgentStore.getState();
    expect(state.agents).toHaveLength(1);
    expect(state.activeAgentId).toBe('default-agent');
  });

  it('createAgent appends a new agent and switches active to it', async () => {
    await useAgentStore.getState().createAgent(mockGetToken);
    const state = useAgentStore.getState();
    expect(state.agents).toHaveLength(2);
    expect(state.activeAgentId).toBe(state.agents[1]?.id);
  });

  it('patchAgentLocally patches fields in local state without API call', () => {
    useAgentStore.getState().patchAgentLocally('default-agent', { name: 'Updated Name' });
    const agent = useAgentStore.getState().agents.find((a) => a.id === 'default-agent');
    expect(agent?.name).toBe('Updated Name');
    expect(agent?.description).toBe('Summarize lengthy documents effortlessly.');
  });

  it('updateAgent patches specified fields and leaves others unchanged', async () => {
    await useAgentStore.getState().updateAgent('default-agent', { name: 'Updated Name' }, mockGetToken);
    const agent = useAgentStore.getState().agents.find((a) => a.id === 'default-agent');
    expect(agent?.name).toBe('Updated Name');
    expect(agent?.description).toBe('Summarize lengthy documents effortlessly.');
    expect(agent?.enableArtifacts).toBe(false);
  });

  it('deleteAgent removes the agent and switches to first remaining', async () => {
    await useAgentStore.getState().createAgent(mockGetToken);
    const firstId = useAgentStore.getState().agents[0]?.id ?? '';
    await useAgentStore.getState().deleteAgent(firstId, mockGetToken);
    const state = useAgentStore.getState();
    expect(state.agents).toHaveLength(1);
    expect(state.agents.every((a) => a.id !== firstId)).toBe(true);
    expect(state.activeAgentId).toBe(state.agents[0]?.id);
  });

  it('deleteAgent on last agent leaves agents empty', async () => {
    await useAgentStore.getState().deleteAgent('default-agent', mockGetToken);
    const state = useAgentStore.getState();
    expect(state.agents).toHaveLength(0);
  });

  it('selectAgent sets activeAgentId', async () => {
    await useAgentStore.getState().createAgent(mockGetToken);
    const newId = useAgentStore.getState().agents[1]?.id ?? '';
    useAgentStore.getState().selectAgent('default-agent');
    expect(useAgentStore.getState().activeAgentId).toBe('default-agent');
    useAgentStore.getState().selectAgent(newId);
    expect(useAgentStore.getState().activeAgentId).toBe(newId);
  });
});
