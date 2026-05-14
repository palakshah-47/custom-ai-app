import { useEffect } from 'react';
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react';
import { useChatStore } from './store/chatStore';
import { useAgentStore } from './store/agentStore';
import { TopBanner } from './components/TopBanner';
import { Navbar } from './components/Navbar';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatColumn } from './components/ChatColumn';
import { RightPanel } from './components/RightPanel';
import { AppFooter } from './components/AppFooter';
import styles from './App.module.css';

function AuthenticatedApp() {
  const { getToken } = useAuth();

  const showBanner = useChatStore((s) => s.showBanner);
  const dismissBanner = useChatStore((s) => s.dismissBanner);
  const panelView = useChatStore((s) => s.panelView);
  const setPanelView = useChatStore((s) => s.setPanelView);
  const chatLoaded = useChatStore((s) => s.isLoaded);
  const agentLoaded = useAgentStore((s) => s.isLoaded);
  const fetchSessions = useChatStore((s) => s.fetchSessions);
  const fetchAgents = useAgentStore((s) => s.fetchAgents);

  useEffect(() => {
    void fetchSessions(getToken);
    void fetchAgents(getToken);
  }, [fetchSessions, fetchAgents, getToken]);

  if (!chatLoaded || !agentLoaded) {
    return (
      <div className={styles.loading}>
        <span>Loading…</span>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {showBanner && <TopBanner onDismiss={dismissBanner} />}
      <Navbar />
      <div className={styles.body}>
        <ChatSidebar />
        <ChatColumn />
        <RightPanel panelView={panelView} setPanelView={setPanelView} />
      </div>
      <AppFooter />
    </div>
  );
}

export default function App() {
  return (
    <>
      <SignedOut>
        <div className={styles.authPage}>
          <SignIn routing="hash" />
        </div>
      </SignedOut>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
    </>
  );
}
