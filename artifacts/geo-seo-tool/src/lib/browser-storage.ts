// Storage is optional. Private browsing and blocked storage must not prevent
// a completed audit from opening or a dashboard from rendering.
export function readBrowserStorage(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function writeBrowserStorage(key: string, value: string): boolean {
  try { window.localStorage.setItem(key, value); return true; } catch { return false; }
}

export function removeBrowserStorage(key: string): void {
  try { window.localStorage.removeItem(key); } catch { /* Continue without persistence. */ }
}
