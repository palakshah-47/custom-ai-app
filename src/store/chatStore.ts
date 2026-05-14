import { create } from 'zustand';
import type { Session, Message } from '../types';
import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api';

type GetToken = () => Promise<string | null>;

export function formatChatForShare(session: Session): string {
  const lines = session.messages.map((m) => {
    const who = m.role === 'user' ? 'User' : 'Assistant';
    return `**${who}:**\n${m.text}`;
  });
  return `# ${session.title}\n\n${lines.join('\n\n')}`;
}

function sessionVisibleInMainList(s: Session, bookmarksOnly: boolean): boolean {
  if (s.archived) return false;
  if (bookmarksOnly && !s.bookmarked) return false;
  return true;
}

function firstVisibleId(list: Session[], bookmarksOnly: boolean): string | null {
  return (
    list.find((s) => sessionVisibleInMainList(s, bookmarksOnly))?.id ??
    list.find((s) => !s.archived)?.id ??
    list[0]?.id ??
    null
  );
}

interface ChatState {
  sessions: Session[];
  activeSessionId: string;
  bookmarksOnly: boolean;
  loading: boolean;
  message: string;
  showBanner: boolean;
  panelView: 'builder' | 'settings';
  isLoaded: boolean;

  fetchSessions: (getToken: GetToken) => Promise<void>;
  newChat: (getToken: GetToken) => Promise<void>;
  selectSession: (id: string) => void;
  setMessage: (msg: string) => void;
  setLoading: (v: boolean) => void;
  renameSession: (id: string, title: string, getToken: GetToken) => Promise<void>;
  deleteSession: (id: string, getToken: GetToken) => Promise<void>;
  archiveSession: (id: string, getToken: GetToken) => Promise<void>;
  unarchiveSession: (id: string, getToken: GetToken) => Promise<void>;
  toggleSessionBookmark: (id: string, getToken: GetToken) => Promise<void>;
  toggleBookmarksFilter: () => void;
  showAllChats: () => void;
  setMessagesForSession: (sessionId: string) => (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  patchSessionLocally: (sessionId: string, patch: Partial<Session>) => void;
  dismissBanner: () => void;
  setPanelView: (view: 'builder' | 'settings') => void;
  addUserMessageToSession: (sessionId: string, userMsg: Message) => void;
  rateMessage: (sessionId: string, messageId: string, rating: 'up' | 'down', getToken: GetToken) => Promise<void>;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  sessions: [],
  activeSessionId: '',
  bookmarksOnly: false,
  loading: false,
  message: '',
  showBanner: true,
  panelView: 'builder',
  isLoaded: false,

  fetchSessions: async (getToken) => {
    const sessions = await apiGet<Session[]>('/sessions', getToken);
    const active = sessions.find((s) => !s.archived)?.id ?? sessions[0]?.id ?? '';
    set({ sessions, activeSessionId: active, isLoaded: true });
  },

  newChat: async (getToken) => {
    const session = await apiPost<Session>('/sessions', {}, getToken);
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
      message: '',
      bookmarksOnly: false,
    }));
  },

  selectSession: (id) => set({ activeSessionId: id, message: '' }),

  setMessage: (msg) => set({ message: msg }),

  setLoading: (v) => set({ loading: v }),

  renameSession: async (id, title, getToken) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await apiPatch<Session>(`/sessions/${id}`, { title: trimmed, titleEdited: true }, getToken);
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title: trimmed, titleEdited: true } : s
      ),
    }));
  },

  deleteSession: async (id, getToken) => {
    await apiDelete(`/sessions/${id}`, getToken);
    set((state) => {
      const next = state.sessions.filter((s) => s.id !== id);
      if (next.length === 0) return { sessions: next, activeSessionId: '' };
      const newActiveId =
        state.activeSessionId === id
          ? (firstVisibleId(next, state.bookmarksOnly) ?? next[0]?.id ?? '')
          : state.activeSessionId;
      return { sessions: next, activeSessionId: newActiveId };
    });
  },

  archiveSession: async (id, getToken) => {
    await apiPatch<Session>(`/sessions/${id}`, { archived: true }, getToken);
    set((state) => {
      const next = state.sessions.map((s) => (s.id === id ? { ...s, archived: true } : s));
      if (state.activeSessionId !== id) return { sessions: next };
      const pick = firstVisibleId(next, state.bookmarksOnly);
      return { sessions: next, ...(pick ? { activeSessionId: pick } : { activeSessionId: '' }) };
    });
  },

  unarchiveSession: async (id, getToken) => {
    await apiPatch<Session>(`/sessions/${id}`, { archived: false }, getToken);
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === id ? { ...s, archived: false } : s)),
    }));
  },

  toggleSessionBookmark: async (id, getToken) => {
    const session = get().sessions.find((s) => s.id === id);
    if (!session) return;
    await apiPatch<Session>(`/sessions/${id}`, { bookmarked: !session.bookmarked }, getToken);
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, bookmarked: !s.bookmarked } : s
      ),
    }));
  },

  toggleBookmarksFilter: () => {
    set((state) => {
      const next = !state.bookmarksOnly;
      if (!next) return { bookmarksOnly: false };
      const active = state.sessions.find((s) => s.id === state.activeSessionId);
      if (active && (!active.bookmarked || active.archived)) {
        const pick = state.sessions.find((s) => s.bookmarked && !s.archived);
        return { bookmarksOnly: true, ...(pick ? { activeSessionId: pick.id } : {}) };
      }
      return { bookmarksOnly: true };
    });
  },

  showAllChats: () => set({ bookmarksOnly: false }),

  setMessagesForSession: (sessionId) => (updater) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        const nextMsgs = typeof updater === 'function' ? updater(s.messages) : updater;
        return { ...s, messages: nextMsgs };
      }),
    }));
  },

  rateMessage: async (sessionId, messageId, rating, getToken) => {
    await apiPatch(`/sessions/${sessionId}/messages/${messageId}`, { rating }, getToken);
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          messages: s.messages.map((m) =>
            m.id !== messageId ? m : { ...m, rating: m.rating === rating ? undefined : rating }
          ),
        };
      }),
    }));
  },

  patchSessionLocally: (sessionId, patch) => {
    set((state) => ({
      sessions: state.sessions.map((s) => (s.id === sessionId ? { ...s, ...patch } : s)),
    }));
  },

  dismissBanner: () => set({ showBanner: false }),

  setPanelView: (view) => set({ panelView: view }),

  addUserMessageToSession: (sessionId, userMsg) => {
    set((state) => ({
      sessions: state.sessions.map((s) => {
        if (s.id !== sessionId) return s;
        return { ...s, messages: [...s.messages, userMsg] };
      }),
    }));
  },
}));
