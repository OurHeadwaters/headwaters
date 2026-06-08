import { createRoot } from "react-dom/client";
import { Router, Route } from "wouter";
import App from "./App";
import DuckSongTrainingCard from "./pages/duck-song-training";
import DeclarationPage from "./pages/declaration";
import "./index.css";

const base = (import.meta.env.BASE_URL ?? "/privacy-guide/").replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <Router base={base}>
    <Route path="/duck-song-training" component={DuckSongTrainingCard} />
    <Route path="/declaration" component={DeclarationPage} />
    <Route path="/" component={App} />
  </Router>
);
