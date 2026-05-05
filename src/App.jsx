import { useState } from "react";
import { styles } from "./styles/appStyles";
import { useChatSessions } from "./hooks/useChatSessions";
import { TopBanner } from "./components/TopBanner";
import { Navbar } from "./components/Navbar";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatColumn } from "./components/ChatColumn";
import { RightPanel } from "./components/RightPanel";
import { AppFooter } from "./components/AppFooter";

export default function App() {
  const [showBanner, setShowBanner] = useState(true);
  const [panelView, setPanelView] = useState("builder");
  const [inputFocused, setInputFocused] = useState(false);

  const [advancedControl, setAdvancedControl] = useState(false);
  const [enableFileSearch, setEnableFileSearch] = useState(true);
  const [enableArtifacts, setEnableArtifacts] = useState(false);
  const [enableHighQuality, setEnableHighQuality] = useState(false);

  const [agentName, setAgentName] = useState("Analyze a Document");
  const [agentDesc, setAgentDesc] = useState("Summarize lengthy documents effortlessly.");
  const [category, setCategory] = useState("Others");
  const [instructions, setInstructions] = useState(
    "Presentation: In Document Summarizer - DomusAI, you will act as an AI assistant tasked with summarizing documents, including financial documents and worksheets. Your goal is to provide a clear, concise, and informative summary of the given document(s)."
  );
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");

  const chat = useChatSessions(instructions);

  return (
    <div style={styles.root}>
      {showBanner && <TopBanner onDismiss={() => setShowBanner(false)} />}

      <Navbar agentName={agentName} />

      <div style={styles.body}>
        <ChatSidebar
          mainListSessions={chat.mainListSessions}
          archivedSessions={chat.archivedSessions}
          activeSessionId={chat.activeSessionId}
          bookmarksOnly={chat.bookmarksOnly}
          onShowAllChats={chat.showAllChats}
          onToggleBookmarksFilter={chat.toggleBookmarksFilter}
          onNewChat={chat.newChat}
          onSelectSession={chat.selectSession}
          onRenameSession={chat.renameSession}
          onDeleteSession={chat.deleteSession}
          onArchiveSession={chat.archiveSession}
          onUnarchiveSession={chat.unarchiveSession}
          onShareSession={chat.shareSession}
          onToggleSessionBookmark={chat.toggleSessionBookmark}
        />

        <ChatColumn
          agentName={agentName}
          agentDesc={agentDesc}
          message={chat.message}
          setMessage={chat.setMessage}
          messages={chat.messages}
          loading={chat.loading}
          inputFocused={inputFocused}
          setInputFocused={setInputFocused}
          textareaRef={chat.textareaRef}
          messagesEndRef={chat.messagesEndRef}
          handleSend={chat.handleSend}
          handleKeyDown={chat.handleKeyDown}
          handleSuggestion={chat.handleSuggestion}
          hasMessages={chat.hasMessages}
        />

        <RightPanel
          panelView={panelView}
          setPanelView={setPanelView}
          builderProps={{
            agentName,
            setAgentName,
            agentDesc,
            setAgentDesc,
            category,
            setCategory,
            instructions,
            setInstructions,
            enableArtifacts,
            setEnableArtifacts,
            enableHighQuality,
            setEnableHighQuality,
            advancedControl,
            setAdvancedControl,
          }}
          settingsProps={{
            advancedControl,
            setAdvancedControl,
            enableFileSearch,
            setEnableFileSearch,
            supportName,
            setSupportName,
            supportEmail,
            setSupportEmail,
          }}
        />
      </div>

      <AppFooter />
    </div>
  );
}
