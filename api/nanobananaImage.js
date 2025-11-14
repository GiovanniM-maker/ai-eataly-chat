import { createSign } from 'crypto';

// CORS allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://ai-eataly-project.vercel.app'
];

// Cache for access token
let cachedAccessToken = null;
let cachedAccessTokenExpiry = 0;

/**
 * Load Service Account from environment variable
 */
const loadServiceAccount = () => {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON environment variable');
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: must be valid JSON');
  }
};

/**
 * Generate JWT for OAuth2 authentication (Vertex AI scope)
 */
const generateJWT = (serviceAccount) => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
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

/**
 * Get OAuth2 access token (cached for 1 hour)
 */
const getAccessToken = async () => {
  const now = Date.now();
  
  // Return cached token if still valid (refresh 60 seconds before expiry)
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
    console.error('[API] Error getting access token:', error);
    throw error;
  }
};

/**
 * Robust function to extract base64 image from streaming response
 * Tries multiple possible response formats
 */
function extractImageBase64(chunk) {
  try {
    // Try inlineData.data (camelCase)
    const inlineData = chunk?.candidates?.[0]?.content?.parts?.find(
      p => p.inlineData?.data
    );
    if (inlineData) {
      console.log("[API] Extracted image from inlineData.data");
      return inlineData.inlineData.data;
    }

    // Try inline_data.data (snake_case)
    const inline_data = chunk?.candidates?.[0]?.content?.parts?.find(
      p => p.inline_data?.data
    );
    if (inline_data) {
      console.log("[API] Extracted image from inline_data.data");
      return inline_data.inline_data.data;
    }

    // Try media.data
    const media = chunk?.candidates?.[0]?.content?.parts?.find(
      p => p.media?.data
    );
    if (media) {
      console.log("[API] Extracted image from media.data");
      return media.media.data;
    }

    console.error("[API] Could not find image in chunk");
    return null;
  } catch (e) {
    console.error("[extractImageBase64] ERROR:", e);
    return null;
  }
}

/**
 * Call Vertex AI Gemini streaming API
 * ONLY for gemini-2.5-flash-image (Nanobanana)
 */
const callNanobananaAPI = async (prompt) => {
  const accessToken = await getAccessToken();
  const projectId = 'eataly-creative-ai-suite';
  const location = 'us-central1';
  const model = 'gemini-2.5-flash-image';
  
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:streamGenerateContent`;
  
  console.log("[API] ========================================");
  console.log("[API] NANOBANANA IMAGE GENERATION REQUEST");
  console.log("[API] Endpoint:", endpoint);
  console.log("[API] Prompt:", prompt);

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  console.log("[API] Request Body:", JSON.stringify(requestBody, null, 2));

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
    console.error("[API] ========================================");
    console.error("[API] NANOBANANA API ERROR");
    console.error("[API] Status:", response.status);
    console.error("[API] Status Text:", response.statusText);
    console.error("[API] Raw Error Response:", errorText);
    console.error("[API] ========================================");
    throw new Error(`Nanobanana API error: ${response.status} ${errorText}`);
  }

  // Read streaming response
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let imageBase64 = null;
  let buffer = '';

  console.log("[API] Reading streaming response...");

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    
    // Process complete JSON objects in buffer
    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);

      if (!line) continue;

      try {
        const chunk = JSON.parse(line);
        console.log("[API] Received chunk:", Object.keys(chunk));
        
        // Try to extract image from this chunk
        const extracted = extractImageBase64(chunk);
        if (extracted) {
          imageBase64 = extracted;
          console.log("[API] Image found in stream chunk");
          // Continue reading to ensure we get all chunks, but we already have the image
        }
      } catch (e) {
        console.warn("[API] Failed to parse chunk:", e.message);
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    try {
      const chunk = JSON.parse(buffer.trim());
      const extracted = extractImageBase64(chunk);
      if (extracted) {
        imageBase64 = extracted;
        console.log("[API] Image found in final buffer");
      }
    } catch (e) {
      console.warn("[API] Failed to parse final buffer:", e.message);
    }
  }

  if (!imageBase64) {
    console.error("[API] No image data found in streaming response");
    throw new Error('No image data found in Nanobanana API streaming response');
  }

  console.log("[API] Image extracted successfully, length:", imageBase64.length);
  console.log("[API] ========================================");

  return imageBase64;
};

/**
 * Main handler
 */
export default async function handler(req, res) {
  // Handle CORS
  const origin = req.headers.origin || req.headers.referer?.split('/').slice(0, 3).join('/');
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[API] Incoming Nanobanana image generation request', {
      method: req.method,
      origin: req.headers.origin,
      url: req.url
    });

    const { prompt, model } = req.body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "prompt" field' });
    }

    // ONLY allow gemini-2.5-flash-image
    const modelToUse = model || "gemini-2.5-flash-image";
    
    if (modelToUse.toLowerCase() !== 'gemini-2.5-flash-image') {
      return res.status(400).json({ 
        error: `Wrong endpoint: model "${modelToUse}" is not supported. This endpoint only accepts "gemini-2.5-flash-image" (Nanobanana). Use /api/chat for Gemini 2.5 Flash or /api/generateImage for Imagen 4.` 
      });
    }

    // Generate image via Vertex AI streaming
    console.log('[API] Calling Nanobanana API:', { prompt, model: modelToUse });
    const imageBase64 = await callNanobananaAPI(prompt);

    if (!imageBase64) {
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    return res.status(200).json({
      image: imageBase64,
      imageBase64: imageBase64 // Backward compatibility
    });
  } catch (error) {
    console.error('[API] ERROR:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

