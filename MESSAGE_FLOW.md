# 📋 Flusso Completo Invio Messaggi - Tutte le Funzioni Coinvolte

## 🔄 Flusso Completo

### 1. **ChatInput.jsx** - Componente Input

#### `handleSubmit(e)`
- **Linea**: 54-80
- **Cosa fa**: Gestisce l'invio del form
- **Flusso**:
  1. Previene default del form
  2. Verifica che ci sia input o immagini
  3. Salva messaggio e immagini in variabili locali
  4. Pulisce input e preview
  5. Imposta `isLoading = true`
  6. Chiama `sendMessage(message, imagesToSend)`
  7. In caso di errore, ripristina input e immagini
  8. Sempre resetta `isLoading = false`

#### `handleImageSelect(e)`
- **Linea**: 26-47
- **Cosa fa**: Gestisce selezione immagini
- **Flusso**:
  1. Filtra solo file immagine
  2. Aggiunge a `selectedImages`
  3. Crea preview con FileReader

---

### 2. **chatStore.js** - Store Zustand

#### `sendMessage(content, images = [])`
- **Linea**: 254-451
- **Cosa fa**: Funzione principale per inviare messaggi
- **Flusso completo**:

##### Step 1: Crea chat se non esiste
```javascript
if (!activeChatId) {
  const newChatId = await get().createNewChat();
  // Aggiunge chat a stato locale
  // Attende 200ms per sincronizzazione
}
```

##### Step 2: Recupera dati chat
```javascript
let currentChat = chats.find(chat => chat.id === activeChatId);
// Se non trovata, fetch da Firestore con getDoc()
```

##### Step 3: Upload immagini su Firebase Storage
```javascript
for (const image of images) {
  uploadBytes(imageRef, image);
  getDownloadURL(imageRef);
  imageUrls.push(downloadURL);
}
```

##### Step 4: Prepara messaggio utente
```javascript
const userMessage = {
  role: 'user',
  content: content || '',
  images: imageUrls (se presenti),
  timestamp: new Date().toISOString()
};
```

##### Step 5: Aggiorna stato locale (ottimistico)
```javascript
const updatedChats = currentChats.map(chat => 
  chat.id === activeChatId 
    ? { ...chat, messages: newMessages, title: newTitle }
    : chat
);
set({ chats: updatedChats });
```

##### Step 6: Salva su Firestore
```javascript
await updateDoc(chatRef, {
  messages: newMessages,
  title: newTitle,
  updatedAt: serverTimestamp()
});
```

##### Step 7: Chiama API Gemini
```javascript
const assistantResponse = await callGeminiAPI(
  content,
  currentModel,
  imageFiles,  // File objects
  imageUrls,   // URLs Firebase
  currentMessages // Storia conversazione
);
```

##### Step 8: Aggiungi risposta assistente
```javascript
const assistantMessage = {
  role: 'assistant',
  content: assistantResponse,
  timestamp: new Date().toISOString()
};
```

##### Step 9: Aggiorna stato locale con risposta
```javascript
const finalUpdatedChats = currentChatsForAssistant.map(chat => 
  chat.id === activeChatId 
    ? { ...chat, messages: finalMessages }
    : chat
);
set({ chats: finalUpdatedChats });
```

##### Step 10: Salva risposta su Firestore
```javascript
await updateDoc(chatRef, {
  messages: finalMessages,
  updatedAt: serverTimestamp()
});
```

#### `callGeminiAPI(message, model, imageFiles, imageUrls, conversationHistory)`
- **Linea**: 53-161
- **Cosa fa**: Chiama l'API Google Gemini
- **Flusso**:

##### Step 1: Prepara storia conversazione
```javascript
const recentHistory = conversationHistory.slice(-10);
recentHistory.forEach(msg => {
  contents.push({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  });
});
```

##### Step 2: Converti File a base64
```javascript
for (const file of imageFiles) {
  const base64Image = await fileToBase64(file);
  const mimeMatch = base64Image.match(/data:([^;]+);base64,(.+)/);
  userParts.push({
    inline_data: {
      mime_type: mimeMatch[1],
      data: mimeMatch[2]
    }
  });
}
```

##### Step 3: Converti URLs a base64 (se presenti)
```javascript
for (const imageUrl of imageUrls) {
  const base64Image = await imageUrlToBase64(imageUrl);
  // Stesso processo di conversione
}
```

##### Step 4: Determina endpoint API
```javascript
const isDevelopment = import.meta.env.DEV;
const apiUrl = import.meta.env.VITE_API_URL || 
  (isDevelopment ? 'http://localhost:3000/api/generate' : '/api/generate');
```

##### Step 5: Chiama API
```javascript
const response = await fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: model || DEFAULT_MODEL,
    contents: contents,
    temperature: 0.7,
    top_p: 0.9,
    maxOutputTokens: 2048,
  }),
});
```

##### Step 6: Processa risposta
```javascript
const data = await response.json();
return data.reply || 'No response generated';
```

#### `fileToBase64(file)`
- **Linea**: 23-31
- **Cosa fa**: Converte File object a base64
- **Usa**: FileReader API

#### `imageUrlToBase64(imageUrl)`
- **Linea**: 33-51
- **Cosa fa**: Converte URL immagine a base64
- **Flusso**:
  1. Fetch URL
  2. Converti a Blob
  3. FileReader per base64

#### `createNewChat()`
- **Linea**: 233-252
- **Cosa fa**: Crea nuova chat su Firestore
- **Flusso**:
  1. Prepara dati chat
  2. `addDoc(collection(db, 'chats'), newChatData)`
  3. Imposta `activeChatId`
  4. Ritorna ID chat

---

### 3. **api/generate.js** - Serverless Function Vercel

#### `handler(req, res)` - Export default
- **Linea**: 164-262
- **Cosa fa**: Handler principale API
- **Flusso**:

##### Step 1: Gestione CORS
```javascript
const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
// Verifica se origin è in ALLOWED_ORIGINS
// Imposta headers CORS
```

##### Step 2: Valida richiesta
```javascript
if (req.method !== 'POST') return 405;
if (!model || !contents) return 400;
```

##### Step 3: Prepara contents con immagini
```javascript
let processedContents = Array.isArray(contents) ? contents : [contents];
if (images && images.length > 0) {
  // Aggiungi immagini al primo messaggio user
  images.forEach(image => {
    firstUserMessage.parts.push({
      inline_data: {
        mime_type: image.mimeType,
        data: sanitizeImage(image.data)
      }
    });
  });
}
```

##### Step 4: Chiama Gemini API
```javascript
try {
  result = await callGeminiAPI(model, processedContents, config, systemInstruction);
} catch (error) {
  // Fallback a gemini-2.5-flash se 404/400
  if (error.message.includes('404') || error.message.includes('400')) {
    modelUsed = 'gemini-2.5-flash';
    result = await callGeminiAPI(modelUsed, ...);
  }
}
```

##### Step 5: Ritorna risposta
```javascript
return res.status(200).json({
  reply: result.candidates[0].content.parts[0].text,
  modelUsed,
  fallbackApplied
});
```

#### `getAccessToken()`
- **Linea**: 67-105
- **Cosa fa**: Ottiene access token OAuth2
- **Flusso**:
  1. Verifica cache (valido per 1 ora)
  2. Carica Service Account
  3. Genera JWT
  4. Scambia JWT per access token
  5. Cache token

#### `generateJWT(serviceAccount)`
- **Linea**: 28-65
- **Cosa fa**: Genera JWT per OAuth2
- **Flusso**:
  1. Crea header (alg: RS256)
  2. Crea payload (iss, sub, scope, aud, exp, iat)
  3. Firma con private key
  4. Ritorna JWT

#### `callGeminiAPI(model, contents, generationConfig, systemInstruction)`
- **Linea**: 128-161
- **Cosa fa**: Chiama Google Gemini API
- **Flusso**:
  1. Ottiene access token
  2. Costruisce endpoint: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  3. Fetch con Bearer token
  4. Ritorna risposta JSON

---

### 4. **ChatWindow.jsx** - Visualizzazione

#### `useEffect` - Auto-scroll
- **Linea**: 17-20
- **Cosa fa**: Scroll automatico quando arrivano nuovi messaggi
- **Trigger**: `activeChat?.messages` cambia

#### Rendering messaggi
- **Linea**: 59-65
- **Cosa fa**: Mappa `activeChat.messages` a `MessageBubble`
- **Key**: Index (potrebbe essere migliorato con ID univoci)

---

## 🔍 Punti di Debug

### Console Logs da Cercare

1. `🔄 Calling Gemini API:` - Inizio chiamata API
2. `📡 Calling API:` - URL endpoint usato
3. `✅ Image file converted to base64:` - Immagine convertita
4. `✅ Image uploaded to Firebase Storage:` - Immagine caricata
5. `✅ User message saved to Firebase:` - Messaggio utente salvato
6. `✅ API Response received:` - Risposta API ricevuta
7. `✅ Assistant message saved to Firebase:` - Risposta salvata
8. `❌ Error...` - Qualsiasi errore

### Errori Comuni

1. **"Missing GOOGLE_SERVICE_ACCOUNT"** → Variabile non impostata su Vercel
2. **"API error: 404"** → Endpoint non trovato (controlla URL)
3. **"Failed to fetch"** → Problema CORS o rete
4. **"Error uploading image"** → Problema Firebase Storage
5. **"No response generated"** → API ritorna risposta vuota

---

## 🛠️ Come Testare

1. **Apri console browser** (F12)
2. **Invia messaggio**
3. **Controlla logs** nella sequenza sopra
4. **Se vedi errore**, controlla:
   - Network tab per chiamate API
   - Console per errori JavaScript
   - Vercel logs per errori serverless

---

## 📝 Note Importanti

- **Aggiornamento ottimistico**: I messaggi appaiono subito nello stato locale, poi si sincronizzano con Firestore
- **Storia conversazione**: Solo ultimi 10 messaggi vengono inviati all'API (per limiti token)
- **Fallback modello**: Se modello non disponibile, usa automaticamente `gemini-2.5-flash`
- **Caching token**: Access token viene cachato per 1 ora
- **Gestione errori**: Errori di upload immagini non bloccano l'invio del messaggio

