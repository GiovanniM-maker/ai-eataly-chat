import { create } from 'zustand';

// Available models
export const MODELS = [
  'gpt-4',
  'gpt-4o',
  'gpt-5',
  'llama-3-70b',
  'mistral-large'
];

// Fake API function that simulates an assistant response
export const fakeApiCall = async (message, model) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return a mock response based on the model
  const responses = {
    'gpt-4': `This is a response from GPT-4. You said: "${message}"`,
    'gpt-4o': `This is a response from GPT-4o. You said: "${message}"`,
    'gpt-5': `This is a response from GPT-5. You said: "${message}"`,
    'llama-3-70b': `This is a response from Llama 3 70B. You said: "${message}"`,
    'mistral-large': `This is a response from Mistral Large. You said: "${message}"`
  };
  
  return responses[model] || responses['gpt-4'];
};

// Zustand store for chat state management
export const useChatStore = create((set, get) => ({
  // State
  currentModel: 'gpt-4',
  chats: [
    {
      id: '1',
      title: 'Welcome Chat',
      messages: [
        { role: 'assistant', content: 'Hello! How can I help you today?' }
      ]
    },
    {
      id: '2',
      title: 'Previous Conversation',
      messages: [
        { role: 'user', content: 'What is React?' },
        { role: 'assistant', content: 'React is a JavaScript library for building user interfaces.' }
      ]
    }
  ],
  activeChatId: '1',
  sidebarCollapsed: false,

  // Actions
  createNewChat: () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: []
    };
    set(state => ({
      chats: [newChat, ...state.chats],
      activeChatId: newChat.id
    }));
    return newChat.id;
  },

  sendMessage: async (content) => {
    const { activeChatId, chats, currentModel } = get();
    
    // Add user message
    const updatedChats = chats.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, { role: 'user', content }],
          // Update title if it's the first user message
          title: chat.messages.length === 0 ? content.slice(0, 50) : chat.title
        };
      }
      return chat;
    });
    
    set({ chats: updatedChats });

    // Get assistant response
    const assistantResponse = await fakeApiCall(content, currentModel);
    
    // Add assistant message
    const finalChats = updatedChats.map(chat => {
      if (chat.id === activeChatId) {
        return {
          ...chat,
          messages: [...chat.messages, { role: 'assistant', content: assistantResponse }]
        };
      }
      return chat;
    });
    
    set({ chats: finalChats });
  },

  switchModel: (model) => {
    set({ currentModel: model });
  },

  setActiveChat: (id) => {
    set({ activeChatId: id });
  },

  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  }
}));

