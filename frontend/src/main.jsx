// ============================================================
// main.jsx — Point d'entrée React
// Monte l'application sur <div id="root"> (index.html).
// BrowserRouter : active le routage HTML5 (URLs propres sans #).
// StrictMode    : active les avertissements de développement React
//                 (double-render intentionnel en dev uniquement).
// ============================================================
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
