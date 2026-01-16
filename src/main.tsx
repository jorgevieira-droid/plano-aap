import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Avoid blank screen on handled backend validation errors that may surface as unhandled rejections
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason as unknown;
  const message =
    typeof reason === 'string'
      ? reason
      : reason && typeof reason === 'object' && 'message' in reason
        ? String((reason as { message?: unknown }).message)
        : '';

  if (message.includes('Edge function returned') || message.includes('email_exists')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

