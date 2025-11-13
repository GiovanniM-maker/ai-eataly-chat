# 🏗️ Architecture Overview

## 📋 Current Architecture

### Frontend → Backend Flow

```
User Input (ChatInput.jsx)
  ↓
sendMessage() in chatStore.js
  ↓
POST /api/chat
{
  message: "Hello",
  model: "gemini-1.5-flash",
  history: [
    { role: "user", content: "..." },
    { role: "assistant", content: "..." }
  ]
}
  ↓
/api/chat.js (Serverless Function)
  - Loads GOOGLE_SERVICE_ACCOUNT_JSON
  - Converts history to Gemini format
  - Calls Google Gemini API
  - Returns { reply: "..." }
  ↓
Frontend updates UI with response
```

## 🔑 Environment Variables

### Required on Vercel

**GOOGLE_SERVICE_ACCOUNT_JSON** (Backend only)
- Type: String (complete JSON)
- Location: Vercel Environment Variables
- Used by: `/api/chat.js`
- Format: Complete Service Account JSON as string

## 📁 File Structure

```
api/
  chat.js              # Main API endpoint (NEW - simplified)

src/
  components/
    ChatInput.jsx      # Input component (no changes needed)
    ChatWindow.jsx     # Chat display (no changes needed)
    ModelSelector.jsx  # Model dropdown (uses updated models)
    ...
  store/
    chatStore.js      # State management (simplified API calls)
  constants/
    models.js         # Model definitions (updated)
  config/
    firebase.js       # Firebase config
```

## 🔄 Key Changes

1. **New Endpoint**: `/api/chat` instead of `/api/generate`
2. **Simplified Request**: `{ message, model, history }` instead of complex `contents`
3. **Backend Handles Formatting**: All Gemini API formatting done server-side
4. **Updated Models**: Using requested models (gemini-1.5-pro, gemini-1.5-flash, gemini-2.0-flash-lite-preview)
5. **Environment Variable**: `GOOGLE_SERVICE_ACCOUNT_JSON` instead of `GOOGLE_SERVICE_ACCOUNT`

## 🚀 Deployment Checklist

- [ ] Set `GOOGLE_SERVICE_ACCOUNT_JSON` on Vercel
- [ ] Verify CORS origins in `/api/chat.js`
- [ ] Test endpoint locally (if possible)
- [ ] Deploy and test on Vercel

