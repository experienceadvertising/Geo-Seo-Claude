export function shouldUseAppShell(pathname: string, isSignedIn: boolean): boolean {
  if (!isSignedIn) return false;
  return pathname === "/" ||
    pathname === "/dashboard" ||
    pathname.startsWith("/results/") ||
    pathname.startsWith("/simulate/") ||
    pathname === "/projects" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/upgrade") ||
    pathname === "/methodology" ||
    pathname === "/contact";
}
