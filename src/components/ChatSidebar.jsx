import { useState, useEffect, useRef, useCallback } from "react";
import { styles } from "../styles/appStyles";

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
  onToggleSessionBookmark,
  onShareSession,
  onUnarchiveSession,
  onArchiveSession,
  onDeleteSession,
  setMenuOpenId,
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (isEditing) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectSession(session.id);
        }
      }}
      style={{
        ...styles.chatSessionRow,
        ...(isActive ? styles.chatSessionRowActive : {}),
        ...(archived ? styles.chatSessionRowArchived : {}),
      }}
      onClick={() => {
        if (!isEditing) onSelectSession(session.id);
      }}
      onMouseEnter={(e) => {
        if (!isActive && !isEditing) e.currentTarget.style.background = "#f0efec";
      }}
      onMouseLeave={(e) => {
        if (!isActive && !isEditing) e.currentTarget.style.background = "transparent";
      }}
    >
      {isEditing ? (
        <input
          ref={titleInputRef}
          type="text"
          style={styles.chatSessionTitleInput}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
            }
          }}
          onBlur={commitEdit}
          maxLength={200}
          aria-label="Chat title"
        />
      ) : (
        <span
          style={styles.chatSessionTitle}
          title={`${session.title} — double-click to rename`}
          onDoubleClick={(e) => {
            e.stopPropagation();
            beginEdit(session);
          }}
        >
          {session.title}
        </span>
      )}
      <div data-chat-menu-root style={styles.chatRowMenuWrap}>
        <button
          type="button"
          style={styles.chatRowMenuBtn}
          title="Chat options"
          aria-expanded={menuOpen}
          onClick={(e) => openMenu(e, session.id)}
        >
          ⋯
        </button>
        {menuOpen && (
          <div style={styles.chatDropdown} onClick={(e) => e.stopPropagation()}>
            <button type="button" style={styles.chatDropdownItem} onClick={() => beginEdit(session)}>
              Rename
            </button>
            <button
              type="button"
              style={styles.chatDropdownItem}
              onClick={() => {
                onToggleSessionBookmark(session.id);
                setMenuOpenId(null);
              }}
            >
              {session.bookmarked ? "Remove bookmark" : "Bookmark"}
            </button>
            <button
              type="button"
              style={styles.chatDropdownItem}
              onClick={() => {
                onShareSession(session.id);
                setMenuOpenId(null);
              }}
            >
              Share
            </button>
            {archived ? (
              <button
                type="button"
                style={styles.chatDropdownItem}
                onClick={() => {
                  onUnarchiveSession(session.id);
                  setMenuOpenId(null);
                }}
              >
                Unarchive
              </button>
            ) : (
              <button
                type="button"
                style={styles.chatDropdownItem}
                onClick={() => {
                  onArchiveSession(session.id);
                  setMenuOpenId(null);
                }}
              >
                Archive
              </button>
            )}
            <button
              type="button"
              style={{ ...styles.chatDropdownItem, color: "#b33" }}
              onClick={() => {
                onDeleteSession(session.id);
                setMenuOpenId(null);
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatSidebar({
  mainListSessions,
  archivedSessions,
  activeSessionId,
  bookmarksOnly,
  onShowAllChats,
  onToggleBookmarksFilter,
  onNewChat,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onArchiveSession,
  onUnarchiveSession,
  onShareSession,
  onToggleSessionBookmark,
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [draftTitle, setDraftTitle] = useState("");
  const titleInputRef = useRef(null);

  const commitEdit = useCallback(() => {
    if (!editingSessionId) return;
    const t = draftTitle.trim();
    if (t) onRenameSession(editingSessionId, t);
    setEditingSessionId(null);
  }, [editingSessionId, draftTitle, onRenameSession]);

  const cancelEdit = useCallback(() => {
    setEditingSessionId(null);
  }, []);

  const beginEdit = useCallback((session) => {
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
    const close = (e) => {
      if (e.target?.closest?.("[data-chat-menu-root]")) return;
      setMenuOpenId(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpenId]);

  const openMenu = (e, id) => {
    e.stopPropagation();
    setMenuOpenId((cur) => (cur === id ? null : id));
  };

  const rowProps = {
    beginEdit,
    commitEdit,
    cancelEdit,
    titleInputRef,
    draftTitle,
    setDraftTitle,
    onSelectSession,
    openMenu,
    onToggleSessionBookmark,
    onShareSession,
    onUnarchiveSession,
    onArchiveSession,
    onDeleteSession,
    setMenuOpenId,
  };

  return (
    <div style={styles.chatSidebar}>
      <div style={styles.chatSidebarToolbar}>
        <button
          type="button"
          style={{
            ...styles.sidebarBtn,
            ...(!bookmarksOnly ? styles.sidebarBtnActive : {}),
          }}
          title="All chats"
          onClick={onShowAllChats}
        >
          ⊞
        </button>
        <button
          type="button"
          style={{
            ...styles.sidebarBtn,
            ...(bookmarksOnly ? styles.sidebarBtnActive : {}),
          }}
          title={bookmarksOnly ? "Show all chats" : "Bookmarked chats only"}
          onClick={onToggleBookmarksFilter}
        >
          🔖
        </button>
        <button type="button" style={styles.sidebarBtn} title="New chat" onClick={onNewChat}>
          ✏️
        </button>
      </div>

      <div style={styles.chatSidebarList}>
        {mainListSessions.length === 0 && (
          <div style={styles.chatSidebarEmpty}>
            {bookmarksOnly ? (
              <>
                No bookmarked chats.
                <br />
                <button
                  type="button"
                  style={{
                    ...styles.chatDropdownItem,
                    marginTop: "8px",
                    textAlign: "center",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    background: "#fff",
                  }}
                  onClick={onShowAllChats}
                >
                  Show all chats
                </button>
              </>
            ) : (
              "Start a new chat with ✏️ or send a message."
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
            <div style={styles.chatSidebarSectionLabel}>Archived</div>
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
