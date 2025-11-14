/**
 * Design System - Premium Minimal Theme
 * Inspired by VisionOS × Linear × Framer × Notion
 */

export const theme = {
  colors: {
    // Base
    bgApp: '#F6F7F9',
    bgSurface: '#FFFFFF',
    borderSubtle: '#ECEEF2',
    borderSoft: '#DDE1E6',
    textMain: '#333D4B',
    textMuted: '#6B7280',
    
    // Accents
    accentPrimary: '#4A74FF',
    accentSuccess: '#6BCB77',
    accentWarning: '#FFB84C',
    
    // Glass effects
    glassWhite: 'rgba(255,255,255,0.35)',
    glassWhiteHover: 'rgba(255,255,255,0.8)',
    glassBorder: 'rgba(200,200,200,0.25)',
    glassMessage: 'rgba(255,255,255,0.65)',
    glassInput: 'rgba(255,255,255,0.9)',
  },
  
  gradients: {
    glare: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(246,248,255,0.55))',
  },
  
  shadows: {
    soft: '0 6px 18px rgba(0,0,0,0.04)',
    message: '0 8px 24px rgba(0,0,0,0.05)',
    input: '0 8px 24px rgba(0,0,0,0.04)',
  },
  
  transitions: {
    default: 'all 150ms ease-out',
    fast: 'all 120ms ease-out',
  },
  
  borderRadius: {
    pill: '9999px',
    card: '18px',
    input: '22px',
    badge: '12px',
  },
};

