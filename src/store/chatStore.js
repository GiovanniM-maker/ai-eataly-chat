import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

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

// Zustand store for chat state management with Firebase integration
export const useChatStore = create((set, get) => ({
  // State
  currentModel: 'gpt-4',
  chats: [],
  activeChatId: null,
  sidebarCollapsed: false,
  loading: true,
  unsubscribe: null,

  // Initialize Firebase listener
  initializeChats: () => {
    const { unsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe(); // Clean up existing listener
    }

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          messages: doc.data().messages || []
        }));

        set({ chats: chatsData, loading: false });

        // Set first chat as active if no active chat is set
        const { activeChatId } = get();
        if (!activeChatId && chatsData.length > 0) {
          set({ activeChatId: chatsData[0].id });
        }
      },
      (error) => {
        console.error('Error loading chats:', error);
        set({ loading: false });
      }
    );

    set({ unsubscribe });
  },

  // Actions
  createNewChat: async () => {
    try {
      const { currentModel } = get();
      const newChatData = {
        title: 'New Chat',
        messages: [],
        model: currentModel,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'chats'), newChatData);
      set({ activeChatId: docRef.id });
      return docRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  },

  sendMessage: async (content) => {
    const { activeChatId, currentModel } = get();
    
    if (!activeChatId) {
      // Create a new chat if none exists
      const newChatId = await get().createNewChat();
      if (!newChatId) return;
      set({ activeChatId: newChatId });
    }

    try {
      const chatRef = doc(db, 'chats', activeChatId);
      const { chats } = get();
      const currentChat = chats.find(chat => chat.id === activeChatId);
      
      // Prepare new messages array
      const newMessages = [
        ...(currentChat?.messages || []),
        { role: 'user', content, timestamp: new Date().toISOString() }
      ];

      // Update title if it's the first user message
      const newTitle = currentChat?.messages.length === 0 
        ? content.slice(0, 50) 
        : (currentChat?.title || 'New Chat');

      // Update chat with user message
      await updateDoc(chatRef, {
        messages: newMessages,
        title: newTitle,
        updatedAt: serverTimestamp()
      });

      // Get assistant response
      const assistantResponse = await fakeApiCall(content, currentModel);
      
      // Add assistant message
      const finalMessages = [
        ...newMessages,
        { role: 'assistant', content: assistantResponse, timestamp: new Date().toISOString() }
      ];

      await updateDoc(chatRef, {
        messages: finalMessages,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  },

  switchModel: (model) => {
    set({ currentModel: model });
    
    // Update current chat's model if there's an active chat
    const { activeChatId } = get();
    if (activeChatId) {
      const chatRef = doc(db, 'chats', activeChatId);
      updateDoc(chatRef, {
        model: model,
        updatedAt: serverTimestamp()
      }).catch(error => {
        console.error('Error updating model:', error);
      });
    }
  },

  setActiveChat: (id) => {
    set({ activeChatId: id });
  },

  toggleSidebar: () => {
    set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  }
}));

