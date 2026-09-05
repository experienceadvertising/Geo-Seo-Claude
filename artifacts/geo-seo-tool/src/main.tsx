import { createRoot } from "react-dom/client";
import { useLayoutEffect } from "react";
import App from "./App";
import "./index.css";
import { installClientErrorReporting } from "./lib/error-reporting";

installClientErrorReporting();
function BootReady() {
  useLayoutEffect(() => {
    document.documentElement.classList.remove("app-booting");
    document.getElementById("app-boot-status")?.remove();
  }, []);
  return <App />;
}
createRoot(document.getElementById("root")!).render(<BootReady />);
