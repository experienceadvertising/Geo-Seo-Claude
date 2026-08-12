import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installClientErrorReporting } from "./lib/error-reporting";

installClientErrorReporting();
createRoot(document.getElementById("root")!).render(<App />);
