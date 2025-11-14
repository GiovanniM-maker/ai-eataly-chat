import { create } from 'zustand';
import { collection, getDocs, addDoc, getDoc, doc } from 'firebase/firestore';
import { db, app } from '../config/firebase';

/**
 * Minimal chat store
 */
export const useChatStore = create((set, get) => ({
  messages: [],

  /**
   * Send a message to /api/chat and get reply
   */
  sendMessage: async (message) => {
    try {
      // Add user message immediately
      const userMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      set(state => ({
        messages: [...state.messages, userMessage]
      }));

      // Call API
      const apiUrl = import.meta.env.VITE_API_URL || '/api/chat';
      const model = "gemini-2.5-flash";
      
      console.log('[Store] Calling API:', apiUrl);
      console.log('[Store] Request body:', { message, model });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          model: model
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `HTTP ${response.status}` };
        }
        throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Store] API response received:', data);

      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: data.reply || 'No response generated',
        timestamp: new Date().toISOString()
      };

      set(state => ({
        messages: [...state.messages, assistantMessage]
      }));

      return data.reply;
    } catch (error) {
      console.error('[Store] Error sending message:', error);
      throw error;
    }
  },

  /**
   * Clear all messages
   */
  clearMessages: () => {
    set({ messages: [] });
  }
}));

export async function testFirestoreRead() {
  console.group("[🔥 EXTREME FIRESTORE READ DEBUG]");

  try {
    console.log("➡️ Starting EXTREME read test...");
    console.log("📌 PROJECT ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);

    const colRef = collection(db, "test");
    console.log("📁 Collection REF:", colRef);

    const querySnapshot = await getDocs(colRef);

    console.log("📄 RAW SNAPSHOT:", querySnapshot);

    const docs = [];
    querySnapshot.forEach((doc) => {
      docs.push({ id: doc.id, ...doc.data() });
    });

    console.log("📄 PARSED DOCUMENTS:", docs);
    console.groupEnd();
    return true;

  } catch (error) {
    console.error("❌ READ FAILED", error);

    if (error.stack) console.error("🧱 STACK:", error.stack);
    if (error.message) console.error("🗯 MESSAGE:", error.message);

    console.groupEnd();
    return false;
  }
}

export async function testFirestoreWrite() {
  console.group("[🔥 EXTREME FIRESTORE WRITE DEBUG]");

  try {
    console.log("➡️ Starting EXTREME write test...");
    console.log("📌 PROJECT ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
    console.log("📌 API KEY:", import.meta.env.VITE_FIREBASE_API_KEY);
    console.log("📌 AUTH DOMAIN:", import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);

    console.log("📦 Firebase APP object:", app);
    console.log("📦 Firestore DB object:", db);

    const payload = {
      message: "Hello from EXTREME DEBUG",
      ts: Date.now(),
      random: Math.random(),
    };

    console.log("🧪 Payload:", payload);

    const colRef = collection(db, "test");
    console.log("📁 Collection REF:", colRef);

    const docRef = await addDoc(colRef, payload);

    console.log("✅ WRITE SUCCESS!");
    console.log("🆔 NEW DOCUMENT ID:", docRef.id);

    console.groupEnd();
    return true;

  } catch (error) {
    console.error("❌ WRITE FAILED", error);

    if (error.stack) console.error("🧱 STACK:", error.stack);
    if (error.message) console.error("🗯 MESSAGE:", error.message);
    if (error.code) console.error("🔥 FIRESTORE ERROR CODE:", error.code);

    console.groupEnd();
    return false;
  }
}

