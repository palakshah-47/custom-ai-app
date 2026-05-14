import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useChatStore, formatChatForShare } from '../store/chatStore';
import type { Session } from '../types';
import styles from './ChatSidebar.module.css';

interface SessionRowProps {
  session: Session;
  archived: boolean;
  isActive: boolean;
  isEditing: boolean;
  draftTitle: string;
  setDraftTitle: (t: string) => void;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  beginEdit: (s: Session) => void;
  commitEdit: () => void;
  cancelEdit: () => void;
  menuOpen: boolean;
  onSelectSession: (id: string) => void;
  openMenu: (e: React.MouseEvent, id: string) => void;
  onToggleBookmark: (id: string) => void;
  onShare: (id: string) => void;
  onUnarchive: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  setMenuOpenId: (id: string | null) => void;
}

function ChatSessionRow({
  session,
  archived,
  isActive,
  isEditing,
  draftTitle,
  setDraftTitle,
  titleInputRef,
  beginEdit,
  commitEdit,
  cancelEdit,
  menuOpen,
  onSelectSession,
  openMenu,
  onToggleBookmark,
  onShare,
  onUnarchive,
  onArchive,
  onDelete,
  setMenuOpenId,
}: SessionRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={`${styles.sessionRow} ${isActive ? styles.sessionRowActive : ''} ${archived ? styles.sessionRowArchived : ''}`}
      onKeyDown={(e) => {
        if (isEditing) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectSession(session.id);
        }
      }}
      onClick={() => {
        if (!isEditing) onSelectSession(session.id);
      }}
    >
      {isEditing ? (
        <input
          ref={titleInputRef}
          type="text"
          className={styles.sessionTitleInput}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
            else if (e.key === 'Escape') { e.preventDefault(); cancelEdit(); }
          }}
          onBlur={commitEdit}
          maxLength={200}
          aria-label="Chat title"
        />
      ) : (
        <span
          className={styles.sessionTitle}
          title={`${session.title} — double-click to rename`}
          onDoubleClick={(e) => { e.stopPropagation(); beginEdit(session); }}
        >
          {session.title}
        </span>
      )}

      <div data-chat-menu-root className={styles.menuWrap}>
        <button
          type="button"
          className={styles.menuBtn}
          title="Chat options"
          aria-expanded={menuOpen}
          onClick={(e) => openMenu(e, session.id)}
        >
          ⋯
        </button>
        {menuOpen && (
          <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.dropdownItem} onClick={() => beginEdit(session)}>
              Rename
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => { onToggleBookmark(session.id); setMenuOpenId(null); }}
            >
              {session.bookmarked ? 'Remove bookmark' : 'Bookmark'}
            </button>
            <button
              type="button"
              className={styles.dropdownItem}
              onClick={() => { onShare(session.id); setMenuOpenId(null); }}
            >
              Share
            </button>
            {archived ? (
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => { onUnarchive(session.id); setMenuOpenId(null); }}
              >
                Unarchive
              </button>
            ) : (
              <button
                type="button"
                className={styles.dropdownItem}
                onClick={() => { onArchive(session.id); setMenuOpenId(null); }}
              >
                Archive
              </button>
            )}
            <button
              type="button"
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
              onClick={() => { onDelete(session.id); setMenuOpenId(null); }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatSidebar() {
  const { getToken } = useAuth();

  const sessions = useChatStore((s) => s.sessions);
  const activeSessionId = useChatStore((s) => s.activeSessionId);
  const bookmarksOnly = useChatStore((s) => s.bookmarksOnly);
  const newChat = useChatStore((s) => s.newChat);
  const selectSession = useChatStore((s) => s.selectSession);
  const renameSession = useChatStore((s) => s.renameSession);
  const deleteSession = useChatStore((s) => s.deleteSession);
  const archiveSession = useChatStore((s) => s.archiveSession);
  const unarchiveSession = useChatStore((s) => s.unarchiveSession);
  const toggleSessionBookmark = useChatStore((s) => s.toggleSessionBookmark);
  const showAllChats = useChatStore((s) => s.showAllChats);
  const toggleBookmarksFilter = useChatStore((s) => s.toggleBookmarksFilter);

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const mainListSessions = sessions.filter(
    (s) => !s.archived && (!bookmarksOnly || s.bookmarked)
  );
  const archivedSessions = sessions.filter((s) => s.archived);

  const commitEdit = useCallback(() => {
    if (!editingSessionId) return;
    const t = draftTitle.trim();
    if (t) void renameSession(editingSessionId, t, getToken);
    setEditingSessionId(null);
  }, [editingSessionId, draftTitle, renameSession, getToken]);

  const cancelEdit = useCallback(() => setEditingSessionId(null), []);

  const beginEdit = useCallback((session: Session) => {
    setDraftTitle(session.title);
    setEditingSessionId(session.id);
    setMenuOpenId(null);
  }, []);

  useEffect(() => {
    if (!editingSessionId) return;
    const el = titleInputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editingSessionId]);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = (e: MouseEvent) => {
      if ((e.target as Element)?.closest?.('[data-chat-menu-root]')) return;
      setMenuOpenId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpenId]);

  const openMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setMenuOpenId((cur) => (cur === id ? null : id));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    void deleteSession(id, getToken);
  };

  const handleShare = async (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    const text = formatChatForShare(session);
    try {
      await navigator.clipboard.writeText(text);
      window.alert('Chat copied to clipboard. You can paste it into email or a doc.');
    } catch {
      window.prompt('Copy this text:', text);
    }
  };

  const rowProps = {
    beginEdit,
    commitEdit,
    cancelEdit,
    titleInputRef,
    draftTitle,
    setDraftTitle,
    onSelectSession: selectSession,
    openMenu,
    onToggleBookmark: (id: string) => void toggleSessionBookmark(id, getToken),
    onShare: (id: string) => void handleShare(id),
    onUnarchive: (id: string) => void unarchiveSession(id, getToken),
    onArchive: (id: string) => void archiveSession(id, getToken),
    onDelete: handleDelete,
    setMenuOpenId,
  };

  return (
    <div className={styles.chatSidebar}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={`${styles.sidebarBtn} ${!bookmarksOnly ? styles.sidebarBtnActive : ''}`}
          title="All chats"
          onClick={showAllChats}
        >
          ⊞
        </button>
        <button
          type="button"
          className={`${styles.sidebarBtn} ${bookmarksOnly ? styles.sidebarBtnActive : ''}`}
          title={bookmarksOnly ? 'Show all chats' : 'Bookmarked chats only'}
          onClick={toggleBookmarksFilter}
        >
          🔖
        </button>
        <button type="button" className={styles.sidebarBtn} title="New chat" onClick={() => void newChat(getToken)}>
          ✏️
        </button>
      </div>

      <div className={styles.list}>
        {mainListSessions.length === 0 && (
          <div className={styles.empty}>
            {bookmarksOnly ? (
              <>
                No bookmarked chats.
                <br />
                <button type="button" className={styles.showAllBtn} onClick={showAllChats}>
                  Show all chats
                </button>
              </>
            ) : (
              'Start a new chat with ✏️ or send a message.'
            )}
          </div>
        )}

        {mainListSessions.map((s) => (
          <ChatSessionRow
            key={s.id}
            session={s}
            archived={false}
            isActive={s.id === activeSessionId}
            isEditing={editingSessionId === s.id}
            menuOpen={menuOpenId === s.id}
            {...rowProps}
          />
        ))}

        {archivedSessions.length > 0 && (
          <>
            <div className={styles.sectionLabel}>Archived</div>
            {archivedSessions.map((s) => (
              <ChatSessionRow
                key={s.id}
                session={s}
                archived
                isActive={s.id === activeSessionId}
                isEditing={editingSessionId === s.id}
                menuOpen={menuOpenId === s.id}
                {...rowProps}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
