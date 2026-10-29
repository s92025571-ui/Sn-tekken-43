/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

import { registerSW } from 'virtual:pwa-register';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register service worker for full offline Android/PWA play
try {
  registerSW({ immediate: true });
} catch {
  // Safe fallback if service workers are restricted in nested iframe preview
}

createRoot(document.getElementById('root')!).render(<App />);
