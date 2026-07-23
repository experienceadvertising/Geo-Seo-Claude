import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { existsSync } from "node:fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT ?? "4173";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

// Per-route static HTML for non-JS crawlers (GPTBot, ClaudeBot,
// PerplexityBot, OAI-SearchBot, Bytespider, CCBot, Twitter/X, LinkedIn,
// Slack, iMessage). The actual writing happens in scripts/prerender.mjs,
// invoked from the package "build" script after vite build completes.
// That script reads scripts/seo-manifest.mjs and writes dist/public/<route>/
// index.html for every public route with route-specific title, meta,
// canonical, og:* / article:*, twitter:*, and JSON-LD baked in.
//
// SPA fallback: serve index.html for any path that looks like a page route.
// Vite preview serves built static files literally, so direct navigation to
// /verify-email or /sign-in would 404. This middleware rewrites those requests
// to serve index.html while keeping the browser URL intact so the React router
// can pick up the path + query string (e.g. ?token=...).
//
// When a prerendered file exists at dist/public/<path>/index.html we let the
// static handler serve that file instead of rewriting to the root index.html.
// Otherwise non-JS crawlers would never see the route-specific title/meta/
// JSON-LD that the prerender step inlines.
function spaFallback(): Plugin {
  const distPublic = path.resolve(import.meta.dirname, "dist", "public");
  return {
    name: "spa-fallback",
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const assetPath = (req.url ?? "").split("?")[0];
        if (/\/assets\/.*\.[a-f0-9]{8,}\.(?:js|css|woff2?|png|jpe?g|webp|svg)$/i.test(assetPath)) {
          _res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (assetPath.endsWith(".html") || !/\.[a-z0-9]+$/i.test(assetPath)) {
          _res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
        }
        const url = req.url ?? "/";
        const pathname = url.split("?")[0];
        const hasFileExtension = /\.[a-zA-Z0-9]{1,10}$/.test(pathname);
        const isViteInternal = pathname.startsWith("/@") || pathname === "/__vite_ping";
        if (hasFileExtension || isViteInternal) {
          next();
          return;
        }

        const trimmed = pathname.replace(/^\/+|\/+$/g, "");
        if (trimmed) {
          const prerendered = path.join(distPublic, trimmed, "index.html");
          if (existsSync(prerendered)) {
            req.url = "/" + trimmed + "/";
            next();
            return;
          }
        }

        // No prerendered match — fall back to the root index.html so the
        // SPA can render the route client-side.
        req.url = basePath.replace(/\/$/, "") + "/";
        next();
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    spaFallback(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ["recharts"],
          markdown: ["react-markdown"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
