import React, { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { UsageMeter } from "@/components/usage-meter";

function AdminLink() {
  const { isSignedIn } = useAuth();
  const { data } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["admin", "me"],
    queryFn: () => customFetch<{ isAdmin: boolean }>("/api/admin/me"),
    enabled: isSignedIn,
    retry: false,
    staleTime: 60_000,
  });
  if (!data?.isAdmin) return null;
  return (
    <Link
      href="/admin"
      className="hidden sm:flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      title="Admin dashboard"
    >
      <Shield className="h-4 w-4" />
      <span>Admin</span>
    </Link>
  );
}

function UserBadge() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  if (!user) return null;
  const label = user.email || "Account";
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-xs text-muted-foreground max-w-[200px] truncate">{label}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut().then(() => setLocation("/"))}
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Sign out</span>
      </Button>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [pathname] = useLocation();

  // Scroll to top on every route change so users land at the top of the new
  // page (default browser behavior is to keep prior scroll position in SPAs).
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
          <div className="flex mr-4 items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-sm">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="whitespace-nowrap">AEO Improvement</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            {isLoaded && isSignedIn && (
              <>
                <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
                  <Link href="/" className="hover:text-foreground transition-colors">Audits</Link>
                  <Link href="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                </nav>
                <UsageMeter />
                <AdminLink />
                <UserBadge />
              </>
            )}
            {isLoaded && !isSignedIn && (
              <>
                <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
                  <Link href="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                </nav>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-muted/30 mt-12">
      <div className="container max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-teal-600 to-emerald-700 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span>AEO Improvement</span>
            </Link>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Audit, simulate, and fix how AI search engines see your site.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Product</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition-colors">Audit a site</Link></li>
              <li><Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><Link href="/methodology" className="hover:text-foreground transition-colors">Methodology</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Compare</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/vs/otterly" className="hover:text-foreground transition-colors">vs Otterly.AI</Link></li>
              <li><Link href="/vs/athenahq" className="hover:text-foreground transition-colors">vs AthenaHQ</Link></li>
              <li><Link href="/vs/profound" className="hover:text-foreground transition-colors">vs Profound</Link></li>
              <li><Link href="/vs/brandlight" className="hover:text-foreground transition-colors">vs Brandlight</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Guides</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/best-aeo-tools" className="hover:text-foreground transition-colors">Best AEO Tools</Link></li>
              <li><Link href="/best-geo-optimization-tools" className="hover:text-foreground transition-colors">Best GEO Tools</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>© {year} AEO Improvement. All rights reserved.</span>
          <span>aeoimprovement.com</span>
        </div>
      </div>
    </footer>
  );
}
