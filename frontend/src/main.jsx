import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ShiftProvider } from "./context/ShiftContext";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ShiftProvider>
        <App />
      </ShiftProvider>
    </BrowserRouter>
  </StrictMode>
);