import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

function removeStaleServiceWorkers() {
  const serviceWorkers = navigator.serviceWorker;
  if (!serviceWorkers?.getRegistrations) return;
  const wasControlled = Boolean(serviceWorkers.controller);
  const unregister = serviceWorkers.getRegistrations()
    .then((registrations) => Promise.all(
      registrations.map((registration) => registration.unregister()),
    ));
  const clearCaches = 'caches' in window
    ? caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith('long-silence-'))
        .map((key) => caches.delete(key)),
    ))
    : Promise.resolve([]);
  void Promise.all([unregister, clearCaches]).then(() => {
    const reloadKey = 'lyra-cache-reset';
    if (wasControlled && sessionStorage.getItem(reloadKey) !== 'done') {
      sessionStorage.setItem(reloadKey, 'done');
      window.location.reload();
    } else {
      sessionStorage.removeItem(reloadKey);
    }
  }).catch(() => undefined);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

window.setTimeout(removeStaleServiceWorkers, 0);
