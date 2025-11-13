# Firebase Setup Instructions

## Configurazione Firestore

Per far funzionare correttamente l'app, devi configurare le regole di sicurezza di Firestore.

### 1. Vai alla Console Firebase
- Accedi a https://console.firebase.google.com/
- Seleziona il progetto: `eataly-creative-ai-suite`

### 2. Configura Firestore Database
- Vai su **Firestore Database** nel menu laterale
- Se non hai ancora creato il database, clicca su **Crea database**
- Scegli la modalità **Produzione** o **Test** (per sviluppo puoi usare Test)

### 3. Configura le Regole di Sicurezza

Vai su **Regole** nella sezione Firestore e imposta queste regole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regole per la collezione chats
    match /chats/{chatId} {
      // Permetti lettura e scrittura a tutti (per sviluppo)
      // In produzione, dovresti aggiungere autenticazione
      allow read, write: if true;
    }
  }
}
```

**⚠️ Nota di Sicurezza:** Le regole sopra permettono a chiunque di leggere e scrivere. Per un'app in produzione, dovresti:
1. Aggiungere autenticazione Firebase
2. Limitare l'accesso solo agli utenti autenticati
3. Implementare regole più specifiche basate sull'utente

### 4. Configura Firebase Storage

L'app usa Firebase Storage per salvare le immagini. Configura le regole di sicurezza:

1. Vai su **Storage** nel menu laterale di Firebase Console
2. Se non hai ancora creato Storage, clicca su **Inizia**
3. Vai su **Regole** e imposta:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permetti lettura e scrittura a tutti (per sviluppo)
    match /chats/{chatId}/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Nota di Sicurezza:** Le regole sopra permettono a chiunque di leggere e scrivere. Per un'app in produzione, dovresti aggiungere autenticazione.

### 5. Struttura dei Dati

L'app crea automaticamente documenti nella collezione `chats` con questa struttura:

```javascript
{
  title: "Titolo della chat",
  messages: [
    {
      role: "user" | "assistant",
      content: "Contenuto del messaggio",
      images: ["https://..."] // Array di URL immagini (opzionale)
      timestamp: "2024-01-01T00:00:00.000Z"
    }
  ],
  model: "gpt-4",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Le immagini vengono salvate in Storage nel percorso: `chats/{chatId}/{timestamp}_{filename}`

### 6. Test

Dopo aver configurato Firestore e Storage:
1. Ricarica l'app
2. Crea una nuova chat
3. Invia un messaggio (con o senza immagini)
4. Verifica che i dati appaiano nella console Firebase
5. Verifica che le immagini appaiano in Storage

## Troubleshooting

- **Errore "Permission denied"**: Controlla le regole di sicurezza di Firestore e Storage
- **Errore "Collection not found"**: Assicurati che Firestore sia abilitato nel progetto
- **Dati non si salvano**: Verifica che le regole permettano la scrittura
- **Immagini non si caricano**: Verifica che Storage sia abilitato e le regole permettano la scrittura
- **Messaggi non appaiono**: Controlla la console del browser per errori e verifica la connessione a Firebase

