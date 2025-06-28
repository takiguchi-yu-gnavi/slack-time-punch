import React from 'react';
import ReactDOM from 'react-dom/client';
import SlackAuthApp from './components/SlackAuthApp';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SlackAuthApp />
  </React.StrictMode>
);
