import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Si quieres que tu app funcione offline y cargue más rápido,
// puedes cambiar unregister() por register() abajo.
// Nota que esto viene con algunas limitaciones.
// Aprende más sobre service workers: https://cra.link/PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('SW registrado: ', registration);
    }).catch(registrationError => {
      console.log('Falló el registro del SW: ', registrationError);
    });
  });
}