import { useChatStore } from '../store/chatStore';

/**
 * Sidebar Component
 * Left sidebar with new chat button and conversation history
 */
const Sidebar = () => {
  const {
    chats,
    activeChatId,
    createNewChat,
    setActiveChat,
    sidebarCollapsed,
    toggleSidebar
  } = useChatStore();

  if (sidebarCollapsed) {
    return (
      <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Expand sidebar"
        >
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <button
          onClick={createNewChat}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium w-full"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Chat
        </button>
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors ml-2"
          aria-label="Collapse sidebar"
        >
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-gray-500 text-sm">No chats yet</p>
            <p className="text-gray-600 text-xs mt-2">Create your first chat to get started</p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 ${
                activeChatId === chat.id ? 'bg-gray-800 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="text-white text-sm font-medium truncate">
                {chat.title || 'New Chat'}
              </div>
              {chat.messages && chat.messages.length > 0 && (
                <div className="text-gray-400 text-xs mt-1 truncate">
                  {chat.messages[chat.messages.length - 1].content.slice(0, 50)}
                  {chat.messages[chat.messages.length - 1].content.length > 50 && '...'}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;

