import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "@rkc/design-system/tokens.css";
import "@rkc/design-system/components.css";
import "./styles/global.scss";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element #root not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
