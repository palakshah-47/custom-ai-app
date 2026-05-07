import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../store/chatStore';
import type { Session } from '../types';

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
  });
}

describe('chatStore', () => {
  beforeEach(resetChatStore);

  it('newChat creates a session and sets it as active', () => {
    useChatStore.getState().newChat();
    const state = useChatStore.getState();
    expect(state.sessions).toHaveLength(2);
    expect(state.activeSessionId).toBe(state.sessions[0]?.id);
  });

  it('deleteSession removes the session and falls back to another', () => {
    useChatStore.getState().newChat();
    const firstId = useChatStore.getState().sessions[1]?.id ?? '';
    useChatStore.getState().deleteSession(firstId);
    const state = useChatStore.getState();
    expect(state.sessions.every((s) => s.id !== firstId)).toBe(true);
  });

  it('deleteSession on last session creates a fresh one', () => {
    useChatStore.getState().deleteSession('test-session');
    const state = useChatStore.getState();
    expect(state.sessions).toHaveLength(1);
    expect(state.sessions[0]?.id).not.toBe('test-session');
  });

  it('selectSession sets activeSessionId and clears message', () => {
    useChatStore.setState({ message: 'hello' });
    useChatStore.getState().newChat();
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

  it('renameSession updates title and sets titleEdited', () => {
    useChatStore.getState().renameSession('test-session', 'My Chat');
    const session = useChatStore.getState().sessions.find((s) => s.id === 'test-session');
    expect(session?.title).toBe('My Chat');
    expect(session?.titleEdited).toBe(true);
  });

  it('toggleSessionBookmark flips the bookmarked flag', () => {
    useChatStore.getState().toggleSessionBookmark('test-session');
    expect(useChatStore.getState().sessions[0]?.bookmarked).toBe(true);
    useChatStore.getState().toggleSessionBookmark('test-session');
    expect(useChatStore.getState().sessions[0]?.bookmarked).toBe(false);
  });
});
