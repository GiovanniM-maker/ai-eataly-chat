/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-app': '#F6F7F9',
        'bg-surface': '#FFFFFF',
        'border-subtle': '#ECEEF2',
        'border-soft': '#DDE1E6',
        'text-main': '#333D4B',
        'text-muted': '#6B7280',
        'accent-primary': '#4A74FF',
        'accent-success': '#6BCB77',
        'accent-warning': '#FFB84C',
      },
      backdropBlur: {
        'glass': '24px',
        'message': '12px',
      },
      transitionDuration: {
        'fast': '120ms',
        'default': '150ms',
      },
    },
  },
  plugins: [],
}

