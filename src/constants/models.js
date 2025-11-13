// Google Gemini Models
export const MODELS = [
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    supportsImages: true,
    description: 'Qualità massima, multimodale'
  },
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    supportsImages: true,
    description: 'Risposte rapide, multimodale'
  },
  {
    id: 'gemini-2.5-flash-image',
    label: 'Gemini 2.5 Flash Image (NanoBanana)',
    supportsImages: true,
    description: 'Ottimizzato per immagini + testo'
  },
  {
    id: 'imagen-3',
    label: 'Imagen 3',
    supportsImages: true,
    description: 'Generazione di immagini ad alta qualità'
  }
];

export const DEFAULT_MODEL = 'gemini-2.5-flash';

// Helper per ottenere info modello
export const getModelInfo = (modelId) => {
  return MODELS.find(m => m.id === modelId) || MODELS.find(m => m.id === DEFAULT_MODEL);
};

