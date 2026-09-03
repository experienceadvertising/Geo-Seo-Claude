export function shouldUseAppShell(pathname: string, isSignedIn: boolean): boolean {
  if (!isSignedIn) return false;
  const route = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return route === "/" ||
    route === "/dashboard" ||
    route.startsWith("/results/") ||
    route.startsWith("/simulate/") ||
    route === "/projects" ||
    route.startsWith("/admin") ||
    route.startsWith("/upgrade") ||
    route === "/methodology" ||
    route === "/contact";
}
