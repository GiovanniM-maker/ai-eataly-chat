# AI Eataly Chat

A ChatGPT-like web application built with React, Vite, and TailwindCSS.

## Features

- 🎨 Modern, dark-mode UI similar to ChatGPT
- 💬 Real-time chat interface with message bubbles
- 🤖 Multiple AI model selection (GPT-4, GPT-4o, GPT-5, Llama 3 70B, Mistral Large)
- 📱 Responsive sidebar with conversation history
- ⚡ Fast and smooth transitions
- 🎯 State management with Zustand

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Project Structure

```
src/
  components/
    Sidebar.jsx          # Left sidebar with chat history
    ChatWindow.jsx       # Main chat interface
    MessageBubble.jsx    # Individual message component
    ModelSelector.jsx    # Model dropdown selector
    ChatInput.jsx        # Message input with auto-resize
  store/
    chatStore.js        # Zustand store for state management
  App.jsx               # Main app component
  main.jsx              # Entry point
  index.css             # Global styles with Tailwind
```

## Technologies

- React 18
- Vite
- TailwindCSS
- Zustand (state management)

