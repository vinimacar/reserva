import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initFrontendErrorLogger } from './services/errorLogger';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize global uncaught error listeners (cross-origin, type errors, unhandled rejections)
initFrontendErrorLogger();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
