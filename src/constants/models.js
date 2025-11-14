/**
 * Model information and descriptions
 * ONLY 3 MODELS SUPPORTED
 */
export const MODEL_INFO = {
  // Text model
  "gemini-2.5-flash": "Modello bilanciato per generazione testo, multimodale, ottimo per task generali con buon tradeoff tra qualità e velocità. Usa REST API Google.",
  
  // Image generation models
  "imagen-4": "Imagen 4: modello text-to-image ad alta qualità tramite Vertex AI. Output molto realistici e dettagliati. Usa endpoint predict di Vertex AI.",
  
  "gemini-2.5-flash-image": "Nanobanana: modello multimodale per generazione immagini tramite Vertex AI. Genera immagini da prompt testuali. Usa endpoint generateContent di Vertex AI.",
  
  "gemini-2.5-nano-banana": "Nanobanana: modello multimodale per generazione testo+immagine tramite Vertex AI. Genera testo e immagini insieme. Usa endpoint generateContent di Vertex AI."
};

/**
 * All available models (4 models)
 */
export const ALL_MODELS = [
  "gemini-2.5-flash",
  "imagen-4",
  "gemini-2.5-flash-image",
  "gemini-2.5-nano-banana"
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
    "gemini-2.5-flash-image": "Nanobanana (Image)",
    "gemini-2.5-nano-banana": "Nanobanana (Multimodal)"
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
