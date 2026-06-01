// ============================================================
// main.jsx
// RÔLE : Point d'entrée de l'application React.
//        Fichier exécuté en premier par Vite au démarrage.
//        Monte le composant App sur le <div id="root"> de index.html.
//        Configure :
//          BrowserRouter → routage HTML5 (URLs propres sans #)
//          StrictMode    → avertissements de développement React
//                          (double-render intentionnel en dev uniquement,
//                           désactivé automatiquement en production)
// ============================================================
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
