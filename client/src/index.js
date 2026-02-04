import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { preventTabRefresh } from "./utils/preventTabRefresh";
import { initReloadDiagnostics } from "./utils/reloadDiagnostics";
import "./utils/storageInit";
import App from "./App";
import "./index.css";

// CRITICAL: Prevent tab refresh BEFORE anything else loads
preventTabRefresh();
initReloadDiagnostics();

// Unregister service workers to simplify caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

const rootElement = document.getElementById("root");

// Check if the page was pre-rendered by react-snap
// If so, hydrate instead of render for better SEO
if (rootElement.hasChildNodes()) {
  // Page was pre-rendered, hydrate it
  ReactDOM.hydrateRoot(
    rootElement,
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  // Normal client-side render
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
