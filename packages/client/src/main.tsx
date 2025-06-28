import React from 'react';
import ReactDOM from 'react-dom/client';

import SlackAuthApp from './components/SlackAuthApp';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <SlackAuthApp />
  </React.StrictMode>
);
