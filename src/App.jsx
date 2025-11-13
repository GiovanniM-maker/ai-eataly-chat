import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';

/**
 * Main App Component
 * Layout with sidebar and chat window
 */
function App() {
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}

export default App;

