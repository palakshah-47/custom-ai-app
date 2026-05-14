import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '../store/chatStore';
import type { Session } from '../types';

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn((_path: string, _body: unknown) =>
    Promise.resolve({ id: crypto.randomUUID(), title: 'New chat', titleEdited: false, messages: [], archived: false, bookmarked: false, createdAt: Date.now() })
  ),
  apiPatch: vi.fn((_path: string, body: unknown) => Promise.resolve(body)),
  apiDelete: vi.fn(() => Promise.resolve()),
}));

const mockGetToken = () => Promise.resolve('mock-token');

const baseSession: Session = {
  id: 'test-session',
  title: 'New chat',
  titleEdited: false,
  messages: [],
  archived: false,
  bookmarked: false,
  createdAt: 0,
};

function resetChatStore() {
  useChatStore.setState({
    sessions: [baseSession],
    activeSessionId: 'test-session',
    bookmarksOnly: false,
    loading: false,
    message: '',
    showBanner: true,
    panelView: 'builder',
    isLoaded: true,
  });
}

describe('chatStore', () => {
  beforeEach(resetChatStore);

  it('newChat creates a session and sets it as active', async () => {
    await useChatStore.getState().newChat(mockGetToken);
    const state = useChatStore.getState();
    expect(state.sessions).toHaveLength(2);
    expect(state.activeSessionId).toBe(state.sessions[0]?.id);
  });

  it('deleteSession removes the session and falls back to another', async () => {
    await useChatStore.getState().newChat(mockGetToken);
    const firstId = useChatStore.getState().sessions[1]?.id ?? '';
    await useChatStore.getState().deleteSession(firstId, mockGetToken);
    const state = useChatStore.getState();
    expect(state.sessions.every((s) => s.id !== firstId)).toBe(true);
  });

  it('deleteSession on last session leaves sessions empty with blank activeSessionId', async () => {
    await useChatStore.getState().deleteSession('test-session', mockGetToken);
    const state = useChatStore.getState();
    expect(state.sessions).toHaveLength(0);
    expect(state.activeSessionId).toBe('');
  });

  it('selectSession sets activeSessionId and clears message', async () => {
    useChatStore.setState({ message: 'hello' });
    await useChatStore.getState().newChat(mockGetToken);
    useChatStore.getState().selectSession('test-session');
    const state = useChatStore.getState();
    expect(state.activeSessionId).toBe('test-session');
    expect(state.message).toBe('');
  });

  it('toggleBookmarksFilter turns on and showAllChats turns off', () => {
    expect(useChatStore.getState().bookmarksOnly).toBe(false);
    useChatStore.getState().toggleBookmarksFilter();
    expect(useChatStore.getState().bookmarksOnly).toBe(true);
    useChatStore.getState().showAllChats();
    expect(useChatStore.getState().bookmarksOnly).toBe(false);
  });

  it('renameSession updates title and sets titleEdited', async () => {
    await useChatStore.getState().renameSession('test-session', 'My Chat', mockGetToken);
    const session = useChatStore.getState().sessions.find((s) => s.id === 'test-session');
    expect(session?.title).toBe('My Chat');
    expect(session?.titleEdited).toBe(true);
  });

  it('toggleSessionBookmark flips the bookmarked flag', async () => {
    await useChatStore.getState().toggleSessionBookmark('test-session', mockGetToken);
    expect(useChatStore.getState().sessions[0]?.bookmarked).toBe(true);
    await useChatStore.getState().toggleSessionBookmark('test-session', mockGetToken);
    expect(useChatStore.getState().sessions[0]?.bookmarked).toBe(false);
  });
});
