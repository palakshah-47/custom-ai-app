import { useChatStore } from './store/chatStore';
import { TopBanner } from './components/TopBanner';
import { Navbar } from './components/Navbar';
import { ChatSidebar } from './components/ChatSidebar';
import { ChatColumn } from './components/ChatColumn';
import { RightPanel } from './components/RightPanel';
import { AppFooter } from './components/AppFooter';
import styles from './App.module.css';

export default function App() {
  const showBanner = useChatStore((s) => s.showBanner);
  const dismissBanner = useChatStore((s) => s.dismissBanner);
  const panelView = useChatStore((s) => s.panelView);
  const setPanelView = useChatStore((s) => s.setPanelView);

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
