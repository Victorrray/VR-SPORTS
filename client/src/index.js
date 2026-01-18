import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// CRITICAL: Prevent tab refresh BEFORE anything else loads
import { preventTabRefresh } from "./utils/preventTabRefresh";
preventTabRefresh();

// Initialize storage before app renders
import "./utils/storageInit";

import App from "./App";
import "./index.css";

// Unregister service workers to simplify caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
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
