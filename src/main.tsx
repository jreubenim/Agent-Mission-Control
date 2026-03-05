import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { HashRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import { MobileSensor } from "./pages/MobileSensor.tsx";
import "./index.css";

// Convex URL is optional — without it, the dashboard runs on fallback static data
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convex = new ConvexReactClient(
  convexUrl || "https://placeholder-unused.convex.cloud"
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/sensor" element={<MobileSensor />} />
        </Routes>
      </HashRouter>
    </ConvexProvider>
  </StrictMode>
);
