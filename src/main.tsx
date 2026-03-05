import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.tsx";
import { MobileSensor } from "./pages/MobileSensor.tsx";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/sensor" element={<MobileSensor />} />
        </Routes>
      </BrowserRouter>
    </ConvexProvider>
  </StrictMode>
);
