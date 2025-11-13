import { createHash, createSign } from 'crypto';

// CORS allowed origins
const ALLOWED_ORIGINS = [
  'https://ai-app-vert-chi.vercel.app',
  'https://ai-88rcx293y-giovannim-makers-projects.vercel.app',
  'https://ai-6zj5iktzo-giovannim-makers-projects.vercel.app',
  'https://ai-z0a43mww7-giovannim-makers-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://giovannim-maker.github.io',
  'https://*.vercel.app',
];

// Cache per access token
let cachedAccessToken = null;
let cachedAccessTokenExpiry = 0;

// Carica Service Account
const loadServiceAccount = () => {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT environment variable');
  }
  return JSON.parse(raw);
};

// Genera JWT per OAuth2
const generateJWT = (serviceAccount) => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/generative-language',
    aud: serviceAccount.token_uri,
    exp: nowInSeconds + 3600,
    iat: nowInSeconds,
  };

  const base64UrlEncode = (obj) => {
    return Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

  const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');
  const sign = createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${unsignedToken}.${signature}`;
};

// Ottieni access token
const getAccessToken = async () => {
  const now = Date.now();
  
  // Se abbiamo un token valido, usalo
  if (cachedAccessToken && now < cachedAccessTokenExpiry - 60000) {
    return cachedAccessToken;
  }

  try {
    const serviceAccount = loadServiceAccount();
    const jwt = generateJWT(serviceAccount);

    const tokenResponse = await fetch(serviceAccount.token_uri, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token request failed: ${tokenResponse.status} ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    cachedAccessToken = tokenData.access_token;
    cachedAccessTokenExpiry = now + (tokenData.expires_in * 1000);

    return cachedAccessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

// Sanitizza immagine base64
const sanitizeImage = (base64Data) => {
  // Rimuovi prefisso data: URL se presente
  let cleaned = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
  // Rimuovi spazi bianchi
  cleaned = cleaned.replace(/\s/g, '');
  return cleaned;
};

// Determina MIME type da base64
const getMimeType = (base64Data) => {
  const header = base64Data.substring(0, 30);
  if (header.startsWith('/9j/') || header.startsWith('iVBORw0KGgo')) {
    return 'image/png';
  }
  if (header.startsWith('UklGR')) {
    return 'image/webp';
  }
  return 'image/jpeg';
};

// Chiama Google Gemini API
const callGeminiAPI = async (model, contents, generationConfig = {}, systemInstruction = null) => {
  const accessToken = await getAccessToken();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const requestBody = {
    contents,
    generationConfig: {
      temperature: generationConfig.temperature || 0.7,
      topP: generationConfig.top_p || 0.9,
      maxOutputTokens: generationConfig.maxOutputTokens || 2048,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = systemInstruction;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  return await response.json();
};

// Handler principale
export default async function handler(req, res) {
  // Gestisci CORS
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
  const isAllowed = ALLOWED_ORIGINS.some(allowed => {
    if (allowed.includes('*')) {
      return origin?.includes(allowed.replace('*.', ''));
    }
    return origin === allowed;
  });

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, contents, temperature, top_p, maxOutputTokens, systemInstruction, images } = req.body;

    if (!model || !contents) {
      return res.status(400).json({ error: 'Missing required fields: model, contents' });
    }

    // Prepara contents con immagini se presenti
    let processedContents = Array.isArray(contents) ? contents : [contents];
    
    if (images && images.length > 0) {
      // Aggiungi immagini al primo messaggio user
      const firstUserMessage = processedContents.find(c => c.role === 'user');
      if (firstUserMessage && firstUserMessage.parts) {
        images.forEach(image => {
          const sanitized = sanitizeImage(image.data);
          const mimeType = image.mimeType || getMimeType(image.data);
          firstUserMessage.parts.push({
            inline_data: {
              mime_type: mimeType,
              data: sanitized,
            },
          });
        });
      }
    }

    // Tenta chiamata API
    let result;
    let modelUsed = model;
    let fallbackApplied = false;

    try {
      result = await callGeminiAPI(
        model,
        processedContents,
        { temperature, top_p, maxOutputTokens },
        systemInstruction
      );
    } catch (error) {
      // Se il modello non è disponibile, fallback a gemini-2.5-flash
      if (error.message.includes('404') || error.message.includes('400')) {
        console.warn(`Model ${model} not available, falling back to gemini-2.5-flash`);
        modelUsed = 'gemini-2.5-flash';
        fallbackApplied = true;
        result = await callGeminiAPI(
          modelUsed,
          processedContents,
          { temperature, top_p, maxOutputTokens },
          systemInstruction
        );
      } else {
        throw error;
      }
    }

    // Estrai risposta
    const reply = result.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    return res.status(200).json({
      reply,
      modelUsed,
      fallbackApplied,
    });
  } catch (error) {
    console.error('Error in generate API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

