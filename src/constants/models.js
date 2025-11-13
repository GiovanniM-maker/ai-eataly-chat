// Google Gemini Models
export const MODELS = [
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    supportsImages: true,
    description: 'Qualità massima, multimodale'
  },
  {
    id: 'gemini-1.5-flash',
    label: 'Gemini 1.5 Flash',
    supportsImages: true,
    description: 'Risposte rapide, multimodale'
  },
  {
    id: 'gemini-2.0-flash-lite-preview',
    label: 'Gemini 2.0 Flash Lite (Preview)',
    supportsImages: true,
    description: 'Versione preview ottimizzata'
  }
];

export const DEFAULT_MODEL = 'gemini-1.5-flash';

// Helper per ottenere info modello
export const getModelInfo = (modelId) => {
  return MODELS.find(m => m.id === modelId) || MODELS.find(m => m.id === DEFAULT_MODEL);
};

