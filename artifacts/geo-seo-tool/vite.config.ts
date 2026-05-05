import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs/promises";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT ?? "4173";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/";

// Per-route static HTML generation for social crawlers.
// Social platforms (Twitter/X, LinkedIn, Slack, iMessage) don't execute JS,
// so react-helmet-async never fires and they see only the generic index.html.
// This plugin runs after every production build and writes a copy of index.html
// for each content route, with the correct <title>, meta description, canonical,
// og:*, and twitter:* tags already baked in.
// The files land at dist/public/<route>/index.html and are served directly by
// the static host — no JavaScript required.
interface RouteMeta {
  path: string;
  title: string;
  description: string;
}

const CONTENT_ROUTES: RouteMeta[] = [
  {
    path: "/what-is-answer-engine-optimization",
    title: "What is Answer Engine Optimization (AEO)? The 2026 Guide",
    description:
      "Answer Engine Optimization (AEO) is the practice of making your website more likely to be cited by AI search engines like ChatGPT, Claude, Gemini, and Perplexity. Learn how it differs from SEO and how to get started.",
  },
  {
    path: "/how-to-appear-in-ai-search",
    title: "How to Appear in AI Search Results: A Practical Guide for 2026",
    description:
      "Learn how to get your website cited by ChatGPT, Claude, Gemini, and Perplexity. This guide covers on-site, off-site, and technical optimizations that increase AI search visibility for brands and businesses.",
  },
  {
    path: "/how-to-rank-in-chatgpt",
    title: "How to Rank in ChatGPT: Get Your Site Cited in AI Answers (2026)",
    description:
      "A practical guide to getting your website cited by ChatGPT search. Covers GPTBot access, entity recognition, structured data, robots.txt strategy, and how to audit your current ChatGPT visibility.",
  },
  {
    path: "/best-aeo-tools",
    title: "Best AEO (Answer Engine Optimization) Tools in 2026: Honest Buyer's Guide",
    description:
      "Compare the best Answer Engine Optimization tools of 2026. Pricing, features, AI engines covered, and which AEO platform fits self-serve marketers, agencies, and enterprise teams.",
  },
  {
    path: "/best-geo-optimization-tools",
    title: "Best GEO (Generative Engine Optimization) Tools in 2026: Honest Buyer's Guide",
    description:
      "Compare the best Generative Engine Optimization tools of 2026. Pricing, features, AI engines covered, and which GEO platform fits self-serve marketers, agencies, and enterprise teams.",
  },
];

const SITE = "https://aeoimprovement.com";

function injectMeta(html: string, route: RouteMeta): string {
  const url = `${SITE}${route.path}`;
  const esc = (s: string) => s.replace(/"/g, "&quot;");
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(route.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${esc(route.description)}"`,
    )
    .replace(
      /<link rel="canonical" href="[^"]*"/,
      `<link rel="canonical" href="${url}"`,
    )
    .replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${url}"`,
    )
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${esc(route.title)}"`,
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${esc(route.description)}"`,
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${esc(route.title)}"`,
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${esc(route.description)}"`,
    );
}

function perRouteMetaTags(): Plugin {
  return {
    name: "per-route-meta-tags",
    apply: "build",
    closeBundle: {
      sequential: true,
      async handler() {
        const outDir = path.resolve(import.meta.dirname, "dist/public");
        const template = await fs.readFile(
          path.join(outDir, "index.html"),
          "utf-8",
        );
        for (const route of CONTENT_ROUTES) {
          const html = injectMeta(template, route);
          const routeDir = path.join(outDir, route.path.slice(1));
          await fs.mkdir(routeDir, { recursive: true });
          await fs.writeFile(path.join(routeDir, "index.html"), html, "utf-8");
        }
      },
    },
  };
}

// SPA fallback: serve index.html for any path that looks like a page route.
// Vite preview serves built static files literally, so direct navigation to
// /verify-email or /sign-in would 404. This middleware rewrites those requests
// to serve index.html while keeping the browser URL intact so the React router
// can pick up the path + query string (e.g. ?token=...).
function spaFallback(): Plugin {
  return {
    name: "spa-fallback",
    configurePreviewServer(server) {
      server.middlewares.use((req, _res, next) => {
        const url = req.url ?? "/";
        // Strip query string for extension check
        const pathname = url.split("?")[0];
        const hasFileExtension = /\.[a-zA-Z0-9]{1,10}$/.test(pathname);
        const isViteInternal = pathname.startsWith("/@") || pathname === "/__vite_ping";
        if (!hasFileExtension && !isViteInternal) {
          // Preserve the full URL (path + query string) in the browser;
          // only tell the static server to serve from the root so it finds index.html.
          req.url = basePath.replace(/\/$/, "") + "/";
        }
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
    perRouteMetaTags(),
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
