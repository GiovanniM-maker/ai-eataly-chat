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
 * Generate JWT for OAuth2 authentication
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
 * Check if model is an Imagen model (uses different payload format)
 */
const isImagenModel = (model) => {
  return model && model.startsWith('imagen-');
};

/**
 * Check if model is a Gemini image model
 */
const isGeminiImageModel = (model) => {
  return model && (model.includes('gemini') && model.includes('image'));
};

/**
 * Call Google Gemini/Imagen API to generate image
 * Uses generateImage endpoint (NOT generateContent) for image models
 */
const callGeminiImageAPI = async (prompt, model = "gemini-2.5-flash-image", imageType = "gemini") => {
  const accessToken = await getAccessToken();
  const apiVersion = "v1";
  
  // Image models MUST use generateImage endpoint
  const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateImage`;
  
  console.log("[API] ========================================");
  console.log("[API] IMAGE GENERATION REQUEST");
  console.log("[API] Model:", model);
  console.log("[API] Image Type:", imageType);
  console.log("[API] Endpoint:", endpoint);
  console.log("[API] Prompt:", prompt);

  let requestBody;

  // Different payload format for Imagen vs Gemini image models
  if (imageType === 'imagen') {
    // Imagen models use simple prompt format
    requestBody = {
      prompt: prompt,
      sampleCount: 1
    };
    console.log("[API] Using Imagen payload format");
  } else {
    // Gemini image models use contents format
    requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };
    console.log("[API] Using Gemini image payload format");
  }

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
    console.error("[API] IMAGE GENERATION ERROR");
    console.error("[API] Status:", response.status);
    console.error("[API] Status Text:", response.statusText);
    console.error("[API] Raw Error:", errorText);
    console.error("[API] ========================================");
    throw new Error(`Gemini API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log("[API] Image generation response received");
  console.log("[API] Response keys:", Object.keys(data));
  
  // Extract base64 image from response
  // Imagen returns: { generatedImages: [{ imageBase64: "..." }] }
  // Gemini image returns: { image: "base64..." } or similar
  let imageBase64 = null;
  
  if (data.generatedImages && data.generatedImages[0]) {
    // Imagen format
    imageBase64 = data.generatedImages[0].imageBase64 || data.generatedImages[0].image;
    console.log("[API] Extracted image from generatedImages array");
  } else if (data.image) {
    // Direct image field
    imageBase64 = data.image;
    console.log("[API] Extracted image from image field");
  } else if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
    // Gemini format
    imageBase64 = data.candidates[0].content.parts[0].inlineData.data;
    console.log("[API] Extracted image from candidates");
  } else {
    console.error("[API] Could not find image in response:", JSON.stringify(data, null, 2));
  }
  
  if (!imageBase64) {
    throw new Error('No image data found in API response');
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
    console.log('[API] Incoming image generation request', {
      method: req.method,
      origin: req.headers.origin,
      url: req.url
    });

    const { prompt, model, imageType } = req.body;

    // Validate required fields
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid "prompt" field' });
    }

    // Validate that model is an image model
    const imageModels = [
      'imagen-3',
      'imagen-3-fast',
      'imagen-3-ultra',
      'imagen-4',
      'imagen-4-ultra',
      'imagen-4-fast',
      'gemini-2.5-flash-image',
      'gemini-1.5-pro-image'
    ];
    
    const modelToUse = model || "gemini-2.5-flash-image";
    
    if (!imageModels.includes(modelToUse.toLowerCase())) {
      return res.status(400).json({ 
        error: `Wrong endpoint: model "${modelToUse}" is not an image model. Use /api/chat, /api/generateVision, or /api/generateAudio instead.` 
      });
    }

    // Determine image type (imagen vs gemini) for payload format
    const finalImageType = imageType || (isImagenModel(modelToUse) ? 'imagen' : 'gemini');

    // Generate image
    console.log('[API] Calling Image API:', { prompt, model: modelToUse, imageType: finalImageType });
    const imageBase64 = await callGeminiImageAPI(prompt, modelToUse, finalImageType);

    if (!imageBase64) {
      return res.status(500).json({ error: 'Failed to generate image' });
    }

    return res.status(200).json({
      image: imageBase64, // Changed from imageBase64 to image for consistency
      imageBase64 // Keep for backward compatibility
    });
  } catch (error) {
    console.error('[API] ERROR:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

