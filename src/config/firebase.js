import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfW-DJsytPbGbIutbYfd9kXO9y7jCqCEg",
  authDomain: "eataly-creative-ai-suite.firebaseapp.com",
  projectId: "eataly-creative-ai-suite",
  storageBucket: "eataly-creative-ai-suite.firebasestorage.app",
  messagingSenderId: "392418318075",
  appId: "1:392418318075:web:3c1aa88df71dca64da425e",
  measurementId: "G-GSE68WH3P9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

export default app;

