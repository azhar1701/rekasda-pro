import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error('Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui;">
      <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <h2 style="color: #dc2626; margin-bottom: 1rem;">Error Loading App</h2>
        <p style="color: #6b7280; margin-bottom: 1rem;">Check console for details</p>
        <button onclick="window.location.reload()" style="background: #1f2937; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.5rem; cursor: pointer;">Reload</button>
      </div>
    </div>
  `;
}