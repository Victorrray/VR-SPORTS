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

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
