import { create } from 'zustand';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
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
  initializeChats: async () => {
    const { unsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe(); // Clean up existing listener
    }

    const chatsRef = collection(db, 'chats');
    
    // First, load initial data quickly with getDocs
    try {
      let snapshot;
      let useOrderBy = true;
      
      // Try with orderBy first
      try {
        const q = query(chatsRef, orderBy('createdAt', 'desc'), limit(50));
        snapshot = await getDocs(q);
      } catch (orderByError) {
        // If orderBy fails (missing index), try without it
        if (orderByError.code === 'failed-precondition' || orderByError.message?.includes('index')) {
          console.warn('OrderBy query requires index, loading without order:', orderByError);
          useOrderBy = false;
          const q = query(chatsRef, limit(50));
          snapshot = await getDocs(q);
        } else {
          throw orderByError;
        }
      }
      
      const chatsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        messages: doc.data().messages || []
      }));

      // Sort manually if we couldn't use orderBy
      if (!useOrderBy) {
        chatsData.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
      }

      set({ chats: chatsData, loading: false });

      // Set first chat as active if no active chat is set
      const { activeChatId } = get();
      if (!activeChatId && chatsData.length > 0) {
        set({ activeChatId: chatsData[0].id });
      }
    } catch (error) {
      console.error('Error loading initial chats:', error);
      set({ loading: false, chats: [] });
      return;
    }

    // Then set up real-time listener for updates
    try {
      let q = query(chatsRef, orderBy('createdAt', 'desc'), limit(50));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const chatsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            messages: doc.data().messages || []
          }));

          set({ chats: chatsData });
        },
        (error) => {
          console.error('Error in real-time listener:', error);
          // Try without orderBy if it fails
          if (error.code === 'failed-precondition') {
            const fallbackQ = query(chatsRef, limit(50));
            const fallbackUnsubscribe = onSnapshot(
              fallbackQ,
              (snapshot) => {
                const chatsData = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                  messages: doc.data().messages || []
                }));
                // Sort manually
                chatsData.sort((a, b) => {
                  const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds || 0;
                  const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds || 0;
                  return bTime - aTime;
                });
                set({ chats: chatsData });
              },
              (fallbackError) => {
                console.error('Error in fallback listener:', fallbackError);
              }
            );
            set({ unsubscribe: fallbackUnsubscribe });
          }
        }
      );

      set({ unsubscribe });
    } catch (error) {
      console.error('Error setting up real-time listener:', error);
    }
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

