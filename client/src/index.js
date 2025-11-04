import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Initialize storage before app renders
import "./utils/storageInit";

// Initialize cache utilities (exposes window.cacheUtils)
import "./utils/cacheUtils";

import App from "./App";
import "./index.css";

// Auto-refresh when Service Worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
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
