import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Initialize storage before app renders
import "./utils/storageInit";

// Initialize cache utilities (exposes window.cacheUtils)
import "./utils/cacheUtils";

import App from "./App";
import "./index.css";

// Auto-update Service Worker and refresh page when new version is available
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('🔄 New Service Worker activated - refreshing page for updates');
    window.location.reload();
  });

  navigator.serviceWorker.ready.then(registration => {
    // Check for updates every 5 seconds
    setInterval(() => {
      registration.update().catch(err => {
        console.warn('⚠️ SW update check failed:', err);
      });
    }, 5000);
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
