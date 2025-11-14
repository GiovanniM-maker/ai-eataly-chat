import ChatUI from './components/ChatUI';
import ChatSidebar from './components/ChatSidebar';

export default function App() {
  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-app)' }}>
      <ChatSidebar />
      <ChatUI />
    </div>
  );
}

