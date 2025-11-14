/**
 * Model information and descriptions
 */
export const MODEL_INFO = {
  // Text models
  "gemini-2.5-pro": "Il modello più avanzato: ragionamento top, coding avanzato, multimodale (testo+immagini+audio+video), context window enorme (~1M token).",
  "gemini-2.5-flash": "Modello bilanciato, multimodale, ottimo per task generali con buon tradeoff tra qualità e velocità.",
  "gemini-2.5-flash-lite": "Versione leggera: latenza bassissima, costi minimi, multitasking multimodale.",
  "gemini-1.5-pro": "Modello Pro della serie 1.5: ragionamento avanzato, multimodale, context window esteso.",
  "gemini-1.5-flash": "Modello Flash della serie 1.5: bilanciato tra velocità e qualità.",
  
  // Image generation models
  "gemini-2.5-flash-image": "Variante specializzata immagini (Nano Banana): generazione, editing, fusioni, multi-image input.",
  "imagen-4": "Modello text-to-image ad alta qualità della famiglia Imagen. Output molto realistici, dettagliati.",
  "imagen-4-ultra": "Versione Ultra: risultati top-tier per rendering fotorealistici, prodotti, ritratti, scenari complessi.",
  "imagen-4-fast": "Variante Fast: generazione rapida a qualità leggermente ridotta.",
  "imagen-3": "Modello Imagen 3: generazione immagini di alta qualità.",
  
  // Vision models
  "gemini-2.5-pro-vision": "Modello Vision multimodale avanzato: analisi immagini, video, documenti con ragionamento complesso.",
  "gemini-1.5-pro-vision": "Modello Vision Pro 1.5: analisi visiva avanzata con context window esteso.",
  
  // Audio models
  "gemini-2.5-flash-audio": "Modello Audio: speech-to-text, text-to-speech, analisi audio, conversazioni vocali.",
  "gemini-1.5-flash-audio": "Modello Audio Flash 1.5: elaborazione audio veloce ed efficiente."
};

/**
 * All available models
 */
export const ALL_MODELS = [
  // Text models
  "gemini-2.5-pro",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  // Image generation models
  "gemini-2.5-flash-image",
  "imagen-4",
  "imagen-4-ultra",
  "imagen-4-fast",
  "imagen-3",
  // Vision models
  "gemini-2.5-pro-vision",
  "gemini-1.5-pro-vision",
  // Audio models
  "gemini-2.5-flash-audio",
  "gemini-1.5-flash-audio"
];

/**
 * Default model
 */
export const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Check if a model is an Imagen model (for image generation)
 */
export const isImagenModel = (model) => {
  return model && model.startsWith("imagen-");
};

/**
 * Check if a model is a Gemini model
 */
export const isGeminiModel = (model) => {
  return model && model.startsWith("gemini-");
};

/**
 * Get model display name
 */
export const getModelDisplayName = (model) => {
  const names = {
    // Text models
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "gemini-2.5-flash": "Gemini 2.5 Flash",
    "gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite",
    "gemini-1.5-pro": "Gemini 1.5 Pro",
    "gemini-1.5-flash": "Gemini 1.5 Flash",
    // Image models
    "gemini-2.5-flash-image": "Gemini 2.5 Flash Image (Nano Banana)",
    "imagen-4": "Imagen 4",
    "imagen-4-ultra": "Imagen 4 Ultra",
    "imagen-4-fast": "Imagen 4 Fast",
    "imagen-3": "Imagen 3",
    // Vision models
    "gemini-2.5-pro-vision": "Gemini 2.5 Pro Vision",
    "gemini-1.5-pro-vision": "Gemini 1.5 Pro Vision",
    // Audio models
    "gemini-2.5-flash-audio": "Gemini 2.5 Flash Audio",
    "gemini-1.5-flash-audio": "Gemini 1.5 Flash Audio"
  };
  return names[model] || model;
};

