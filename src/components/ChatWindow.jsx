import { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import MessageBubble from './MessageBubble';
import ModelSelector from './ModelSelector';
import ChatInput from './ChatInput';

/**
 * ChatWindow Component
 * Main chat interface with header, messages, and input
 */
const ChatWindow = () => {
  const { chats, activeChatId, currentModel } = useChatStore();
  const messagesEndRef = useRef(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">
          {activeChat?.title || 'New Chat'}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Model:</span>
          <ModelSelector />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeChat?.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-300 mb-2">
                Start a new conversation
              </h2>
              <p className="text-gray-500">
                Type a message below to begin chatting with {currentModel}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {activeChat?.messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput />
    </div>
  );
};

export default ChatWindow;

