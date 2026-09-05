export function shouldUseAppShell(pathname: string, isSignedIn: boolean): boolean {
  if (!isSignedIn) return false;
  const route = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return route === "/" ||
    /^\/(seo|actions|ai-visibility)(\/|$)/.test(route) ||
    route === "/dashboard" ||
    route.startsWith("/results/") ||
    route.startsWith("/simulate/") ||
    route === "/projects" ||
    route === "/recommended-tools" ||
    route.startsWith("/admin") ||
    route.startsWith("/upgrade") ||
    route === "/methodology" ||
    route === "/contact";
}

export function pageWorkspaceLink(href: string, pathname: string): string {
  const id = pathname.match(/^\/(?:results|simulate|seo|actions|ai-visibility)\/(\d+)/)?.[1];
  return id && ["/actions", "/seo", "/ai-visibility"].includes(href) ? `${href}/${id}` : href;
}
