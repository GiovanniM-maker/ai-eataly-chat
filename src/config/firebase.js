import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// Firebase configuration from environment variables
// NO FALLBACKS - must use exact values from Vercel environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Log Firebase config immediately after definition (before initialization)
console.log("🔥 Firebase Config in uso:", firebaseConfig);

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Log active Firebase apps after initialization
console.log("🔥 Firebase Apps attive:", getApps());

// Initialize Firestore
export const db = getFirestore(app);

// Enable extreme debug logging
setLogLevel("debug");

