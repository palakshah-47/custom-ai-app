import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentConfig, AgentCategory } from '../types';

const DEFAULT_INSTRUCTIONS =
  'Presentation: In Document Summarizer - AgentAI, you will act as an AI assistant tasked with summarizing documents, including financial documents and worksheets. Your goal is to provide a clear, concise, and informative summary of the given document(s).';

function createDefaultAgent(): AgentConfig {
  return {
    id: crypto.randomUUID(),
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

function createBlankAgent(): AgentConfig {
  return {
    id: crypto.randomUUID(),
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
  createAgent: () => void;
  updateAgent: (id: string, patch: Partial<AgentConfig>) => void;
  selectAgent: (id: string) => void;
  deleteAgent: (id: string) => void;
}

const defaultAgent = createDefaultAgent();

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      agents: [defaultAgent],
      activeAgentId: defaultAgent.id,

      createAgent: () => {
        const newAgent = createBlankAgent();
        set((state) => ({
          agents: [...state.agents, newAgent],
          activeAgentId: newAgent.id,
        }));
      },

      updateAgent: (id, patch) => {
        set((state) => ({
          agents: state.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }));
      },

      selectAgent: (id) => set({ activeAgentId: id }),

      deleteAgent: (id) => {
        set((state) => {
          const next = state.agents.filter((a) => a.id !== id);
          if (next.length === 0) {
            const fresh = createDefaultAgent();
            return { agents: [fresh], activeAgentId: fresh.id };
          }
          const newActiveId =
            state.activeAgentId === id ? (next[0]?.id ?? '') : state.activeAgentId;
          return { agents: next, activeAgentId: newActiveId };
        });
      },
    }),
    {
      name: 'agent-store',
      partialize: (state) => ({
        agents: state.agents,
        activeAgentId: state.activeAgentId,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AgentState>;
        return {
          ...current,
          ...p,
          agents: (p.agents ?? current.agents).map((a) => ({
            ...a,
            temperature: a.temperature ?? 0.7,
            maxTokens: a.maxTokens ?? 1000,
            topP: a.topP ?? 0.9,
            variables: a.variables ?? {},
          })),
        };
      },
    }
  )
);
