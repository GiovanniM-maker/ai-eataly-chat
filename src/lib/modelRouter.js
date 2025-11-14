/**
 * Model Router - Automatic routing for 3 supported models
 * Determines endpoint, payload, and response handling based on model type
 */

/**
 * Resolve model configuration
 * @param {string} modelName - Model identifier
 * @returns {Object} Configuration object with type, endpoint, provider, and modelId
 */
export function resolveModelConfig(modelName) {
  if (!modelName) {
    throw new Error('Model name is required');
  }

  const normalizedModel = modelName.toLowerCase().trim();

  // Model definitions with provider routing
  const models = {
    // Text model - Google REST API
    'gemini-2.5-flash': {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      type: 'text',
      provider: 'google-text',
      endpoint: '/api/chat',
      googleModel: 'gemini-2.5-flash'
    },
    
    // Image model - Vertex AI Imagen
    'imagen-4': {
      id: 'imagen-4',
      name: 'Imagen 4',
      type: 'image',
      provider: 'vertex-imagen',
      endpoint: '/api/generateImage',
      googleModel: 'imagen-4.0-generate-001'
    },
    
    // Image model - Vertex AI Gemini streaming
    'gemini-2.5-flash-image': {
      id: 'gemini-2.5-flash-image',
      name: 'Nanobanana',
      type: 'image',
      provider: 'vertex-gemini-image',
      endpoint: '/api/nanobananaImage',
      googleModel: 'gemini-2.5-flash-image'
    }
  };

  const config = models[normalizedModel];
  
  if (!config) {
    console.warn(`[ModelRouter] Unknown model "${modelName}", defaulting to gemini-2.5-flash`);
    return models['gemini-2.5-flash'];
  }

  return {
    endpoint: config.endpoint,
    type: config.type,
    provider: config.provider,
    modelId: config.id,
    googleModel: config.googleModel
  };
}

/**
 * Check if model is a text model
 */
export function isTextModel(modelName) {
  const config = resolveModelConfig(modelName);
  return config.type === 'text';
}

/**
 * Check if model is an image generation model
 */
export function isImageModel(modelName) {
  const config = resolveModelConfig(modelName);
  return config.type === 'image';
}
