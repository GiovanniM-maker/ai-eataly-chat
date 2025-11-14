import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Get user ID from localStorage
 */
const getUserId = () => {
  const stored = localStorage.getItem('user_id');
  if (stored) {
    return stored;
  }
  const { v4: uuidv4 } = require('uuid');
  const newUserId = uuidv4();
  localStorage.setItem('user_id', newUserId);
  return newUserId;
};

/**
 * Get chat document reference (pipeline is stored as a field in the chat document)
 */
const getChatRef = (chatId) => {
  const userId = getUserId();
  return doc(db, 'users', userId, 'chats', chatId);
};

/**
 * Load pipeline configuration for a specific chat
 * Pipeline is stored as a field in the chat document: users/{uid}/chats/{chatId}
 * @param {string} chatId - The chat ID
 * @returns {Promise<Object>} Pipeline configuration
 */
export async function loadPipelineConfig(chatId) {
  try {
    if (!chatId) {
      console.log('[Pipeline] No chatId provided, returning default config');
      return getDefaultPipelineConfig();
    }

    console.log('[Pipeline] Loading pipeline config for chat:', chatId);
    const chatRef = getChatRef(chatId);
    const chatSnap = await getDoc(chatRef);

    if (chatSnap.exists()) {
      const chatData = chatSnap.data();
      const pipelineData = chatData.pipeline || {};
      
      const config = {
        enabled: pipelineData.enabled || false,
        model: pipelineData.model || null,
        systemInstruction: pipelineData.systemInstruction || '',
        temperature: pipelineData.temperature ?? 0.8,
        topP: pipelineData.topP ?? 0.95,
        maxTokens: pipelineData.maxTokens ?? 2048
      };
      console.log('[Pipeline] Config loaded from chat document:', config);
      return config;
    } else {
      console.log('[Pipeline] Chat document not found, returning default');
      return getDefaultPipelineConfig();
    }
  } catch (error) {
    console.error('[Pipeline] Error loading config:', error);
    return getDefaultPipelineConfig();
  }
}

/**
 * Save pipeline configuration for a specific chat
 * Pipeline is stored as a field in the chat document: users/{uid}/chats/{chatId}
 * @param {string} chatId - The chat ID
 * @param {Object} config - Pipeline configuration
 * @returns {Promise<boolean>} Success status
 */
export async function savePipelineConfig(chatId, config) {
  try {
    if (!chatId) {
      throw new Error('chatId is required to save pipeline config');
    }

    console.log('[Pipeline] Saving pipeline config for chat:', chatId);
    const chatRef = getChatRef(chatId);
    
    const pipelineData = {
      enabled: config.enabled || false,
      model: config.model || null,
      systemInstruction: config.systemInstruction || '',
      temperature: config.temperature ?? 0.8,
      topP: config.topP ?? 0.95,
      maxTokens: config.maxTokens ?? 2048
    };
    
    // Update the chat document with pipeline field
    await setDoc(chatRef, { pipeline: pipelineData }, { merge: true });
    console.log('[Pipeline] Config saved successfully to chat document');
    return true;
  } catch (error) {
    console.error('[Pipeline] Error saving config:', error);
    throw error;
  }
}

/**
 * Get default pipeline configuration
 */
function getDefaultPipelineConfig() {
  return {
    enabled: false,
    model: null,
    systemInstruction: '',
    temperature: 0.8,
    topP: 0.95,
    maxTokens: 2048
  };
}

