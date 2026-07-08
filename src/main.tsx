import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./index.css";

// Default to dark theme — Deep Indigo + Neon is dark-first.
document.documentElement.classList.add("dark");

createRoot(document.getElementById("root")!).render(<App />);
