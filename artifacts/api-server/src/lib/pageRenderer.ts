import { chromium, type Browser } from "playwright-core";
import { execSync } from "node:child_process";

let cachedBrowser: Browser | null = null;
let cachedExecPath: string | null | undefined = undefined;

function findChromiumPath(): string | null {
  if (cachedExecPath !== undefined) return cachedExecPath;
  try {
    const out = execSync("which chromium || which chromium-browser || which google-chrome", {
      encoding: "utf8",
      timeout: 3000,
    }).trim();
    cachedExecPath = out || null;
  } catch {
    cachedExecPath = null;
  }
  return cachedExecPath;
}

async function getBrowser(): Promise<Browser | null> {
  if (cachedBrowser && cachedBrowser.isConnected()) return cachedBrowser;
  const execPath = findChromiumPath();
  if (!execPath) return null;
  try {
    cachedBrowser = await chromium.launch({
      executablePath: execPath,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });
    return cachedBrowser;
  } catch {
    cachedBrowser = null;
    return null;
  }
}

export interface RenderedPage {
  html: string;
  visibleText: string;
  finalUrl: string;
}

export async function renderPage(url: string, timeoutMs = 25000): Promise<RenderedPage | null> {
  const browser = await getBrowser();
  if (!browser) return null;
  let context;
  try {
    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: timeoutMs }).catch(async () => {
      await page.waitForLoadState("domcontentloaded", { timeout: 5000 }).catch(() => {});
    });
    await page.waitForTimeout(800);
    const html = await page.content();
    const visibleText = await page.evaluate(() => {
      const body = document.body;
      if (!body) return "";
      const clone = body.cloneNode(true) as HTMLElement;
      clone.querySelectorAll("script,style,noscript,template").forEach((n) => n.remove());
      return (clone.innerText || "").replace(/\s+/g, " ").trim();
    });
    const finalUrl = page.url();
    await context.close();
    return { html, visibleText, finalUrl };
  } catch {
    if (context) await context.close().catch(() => {});
    return null;
  }
}

export async function closeBrowser(): Promise<void> {
  if (cachedBrowser) {
    await cachedBrowser.close().catch(() => {});
    cachedBrowser = null;
  }
}
