import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './styles/index.css';

// Tauri deep linkプラグインの初期化
const initializeApp = (): void => {
  try {
    // Tauri v2ではdeep linkプラグインは自動で初期化されます
    console.log('App initialized, deep link plugin ready');
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// アプリケーションを初期化してからレンダリング
initializeApp();
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
