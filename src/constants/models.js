/**
 * Model information and descriptions
 * ONLY 3 MODELS SUPPORTED
 */
export const MODEL_INFO = {
  // Text model
  "gemini-2.5-flash": "Modello bilanciato per generazione testo, multimodale, ottimo per task generali con buon tradeoff tra qualità e velocità. Usa REST API Google.",
  
  // Image generation models
  "imagen-4": "Imagen 4: modello text-to-image ad alta qualità tramite Vertex AI. Output molto realistici e dettagliati. Usa endpoint predict di Vertex AI.",
  
  "gemini-2.5-flash-image": "Nanobanana: modello multimodale per generazione immagini tramite Vertex AI streaming. Genera immagini da prompt testuali. Usa endpoint streamGenerateContent di Vertex AI."
};

/**
 * All available models (ONLY 3)
 */
export const ALL_MODELS = [
  "gemini-2.5-flash",
  "imagen-4",
  "gemini-2.5-flash-image"
];

/**
 * Default model
 */
export const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Get model display name
 */
export const getModelDisplayName = (model) => {
  const names = {
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "imagen-4": "Imagen 4",
    "gemini-2.5-flash-image": "Nanobanana"
  };
  return names[model] || model;
};

/**
 * Check if a model is an Imagen model
 */
export const isImagenModel = (model) => {
  return model === "imagen-4";
};

/**
 * Check if a model is a Gemini model
 */
export const isGeminiModel = (model) => {
  return model && model.startsWith("gemini-");
};
