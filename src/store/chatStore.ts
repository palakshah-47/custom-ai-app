import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, Message } from '../types';

function createEmptySession(): Session {
  return {
    id: crypto.randomUUID(),
    title: 'New chat',
    titleEdited: false,
    messages: [],
    archived: false,
    bookmarked: false,
    createdAt: Date.now(),
  };
}

function titleFromFirstMessage(text: string): string {
  const line = text.trim().split(/\r?\n/)[0] ?? '';
  const t = line.replace(/\s+/g, ' ').trim();
  if (!t) return 'New chat';
  return t.length > 80 ? `${t.slice(0, 80)}…` : t;
}

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
  newChat: () => void;
  selectSession: (id: string) => void;
  setMessage: (msg: string) => void;
  setLoading: (v: boolean) => void;
  renameSession: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
  archiveSession: (id: string) => void;
  unarchiveSession: (id: string) => void;
  toggleSessionBookmark: (id: string) => void;
  toggleBookmarksFilter: () => void;
  showAllChats: () => void;
  setMessagesForSession: (sessionId: string) => (updater: Message[] | ((prev: Message[]) => Message[])) => void;
  dismissBanner: () => void;
  setPanelView: (view: 'builder' | 'settings') => void;
  addUserMessageToSession: (sessionId: string, userMsg: string) => void;
  rateMessage: (sessionId: string, messageId: string, rating: 'up' | 'down') => void;
}

const initialSession = createEmptySession();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [initialSession],
      activeSessionId: initialSession.id,
      bookmarksOnly: false,
      loading: false,
      message: '',
      showBanner: true,
      panelView: 'builder',

      newChat: () => {
        const s = createEmptySession();
        set((state) => ({
          sessions: [s, ...state.sessions],
          activeSessionId: s.id,
          message: '',
          bookmarksOnly: false,
        }));
      },

      selectSession: (id) => set({ activeSessionId: id, message: '' }),

      setMessage: (msg) => set({ message: msg }),

      setLoading: (v) => set({ loading: v }),

      renameSession: (id, title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title: trimmed, titleEdited: true } : s
          ),
        }));
      },

      deleteSession: (id) => {
        set((state) => {
          const next = state.sessions.filter((s) => s.id !== id);
          if (next.length === 0) {
            const fresh = createEmptySession();
            return { sessions: [fresh], activeSessionId: fresh.id };
          }
          const newActiveId =
            state.activeSessionId === id
              ? (firstVisibleId(next, state.bookmarksOnly) ?? next[0]?.id ?? '')
              : state.activeSessionId;
          return { sessions: next, activeSessionId: newActiveId };
        });
      },

      archiveSession: (id) => {
        set((state) => {
          const next = state.sessions.map((s) => (s.id === id ? { ...s, archived: true } : s));
          if (state.activeSessionId !== id) return { sessions: next };
          const pick = firstVisibleId(next, state.bookmarksOnly);
          if (pick) return { sessions: next, activeSessionId: pick };
          const fresh = createEmptySession();
          return { sessions: [fresh, ...next], activeSessionId: fresh.id };
        });
      },

      unarchiveSession: (id) =>
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, archived: false } : s)),
        })),

      toggleSessionBookmark: (id) =>
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, bookmarked: !s.bookmarked } : s
          ),
        })),

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

      rateMessage: (sessionId, messageId, rating) => {
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

      dismissBanner: () => set({ showBanner: false }),

      setPanelView: (view) => set({ panelView: view }),

      addUserMessageToSession: (sessionId, userMsg) => {
        // read current sessions inside action to avoid stale closure
        const { sessions } = get();
        const session = sessions.find((s) => s.id === sessionId);
        const autoTitle =
          session && !session.titleEdited && session.messages.length === 0
            ? titleFromFirstMessage(userMsg)
            : null;

        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              ...(autoTitle ? { title: autoTitle } : {}),
              messages: [
                ...s.messages,
                {
                  id: crypto.randomUUID(),
                  role: 'user' as const,
                  text: userMsg,
                  createdAt: Date.now(),
                },
              ],
            };
          }),
        }));
      },
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        bookmarksOnly: state.bookmarksOnly,
      }),
    }
  )
);
