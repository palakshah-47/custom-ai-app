import { create } from 'zustand';
import type { AgentConfig, AgentCategory } from '../types';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';

type GetToken = () => Promise<string | null>;

const DEFAULT_INSTRUCTIONS =
  'Presentation: In Document Summarizer - AgentAI, you will act as an AI assistant tasked with summarizing documents, including financial documents and worksheets. Your goal is to provide a clear, concise, and informative summary of the given document(s).';

function defaultAgentData(): Omit<AgentConfig, 'id'> {
  return {
    name: 'Analyze a Document',
    description: 'Summarize lengthy documents effortlessly.',
    category: 'Others' as AgentCategory,
    instructions: DEFAULT_INSTRUCTIONS,
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
}

function blankAgentData(): Omit<AgentConfig, 'id'> {
  return {
    name: 'New Agent',
    description: '',
    category: 'Others' as AgentCategory,
    instructions: '',
    enableArtifacts: false,
    enableHighQuality: false,
    advancedControl: false,
    enableFileSearch: false,
    supportName: '',
    supportEmail: '',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    variables: {},
  };
}

interface AgentState {
  agents: AgentConfig[];
  activeAgentId: string;
  isLoaded: boolean;

  fetchAgents: (getToken: GetToken) => Promise<void>;
  createAgent: (getToken: GetToken) => Promise<void>;
  /** Update local state only — no API call. Use for text field onChange to avoid per-keystroke requests. */
  patchAgentLocally: (id: string, patch: Partial<AgentConfig>) => void;
  /** Update local state AND persist to backend. Use on blur or for discrete changes (toggles, sliders). */
  updateAgent: (id: string, patch: Partial<AgentConfig>, getToken: GetToken) => Promise<void>;
  selectAgent: (id: string) => void;
  deleteAgent: (id: string, getToken: GetToken) => Promise<void>;
}

export const useAgentStore = create<AgentState>()((set) => ({
  agents: [],
  activeAgentId: '',
  isLoaded: false,

  fetchAgents: async (getToken) => {
    let agents = await apiGet<AgentConfig[]>('/agents', getToken);
    // Create a default agent for new users
    if (agents.length === 0) {
      const created = await apiPost<AgentConfig>('/agents', defaultAgentData(), getToken);
      agents = [created];
    }
    set({ agents, activeAgentId: agents[0]?.id ?? '', isLoaded: true });
  },

  patchAgentLocally: (id, patch) => {
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  },

  createAgent: async (getToken) => {
    const newAgent = await apiPost<AgentConfig>('/agents', blankAgentData(), getToken);
    set((state) => ({
      agents: [...state.agents, newAgent],
      activeAgentId: newAgent.id,
    }));
  },

  updateAgent: async (id, patch, getToken) => {
    set((state) => ({
      agents: state.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
    await apiPatch<AgentConfig>(`/agents/${id}`, patch, getToken);
  },

  selectAgent: (id) => set({ activeAgentId: id }),

  deleteAgent: async (id, getToken) => {
    await apiDelete(`/agents/${id}`, getToken);
    set((state) => {
      const next = state.agents.filter((a) => a.id !== id);
      const newActiveId =
        state.activeAgentId === id ? (next[0]?.id ?? '') : state.activeAgentId;
      return { agents: next, activeAgentId: newActiveId };
    });
  },
}));
