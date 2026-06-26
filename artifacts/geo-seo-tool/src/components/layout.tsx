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
                  <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
                  <Link href="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                  <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
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
    <footer className="relative overflow-hidden bg-gray-950 text-gray-400">
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.6) 40%, rgba(20,184,166,0.6) 60%, transparent)" }}
      />
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-teal-500/5 blur-[80px]" />
      </div>

      <div className="relative container max-w-screen-xl px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 mb-14">
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 font-bold text-white group">
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-900/40 group-hover:shadow-emerald-700/40 transition-shadow">
                <Sparkles className="h-4 w-4" />
              </span>
              <span className="text-lg tracking-tight">AEO Improvement</span>
            </Link>
            <p className="text-sm leading-relaxed mt-4 mb-6 max-w-xs text-gray-400">
              Audit, simulate, and fix how AI search engines see your site. Built for marketers who ship.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Live audits running now
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-5">Product</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Audit a site", href: "/" },
                { label: "Pricing", href: "/pricing" },
                { label: "Methodology", href: "/methodology" },
                { label: "About", href: "/about" },
                { label: "Contact", href: "/contact" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-5">Compare</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "vs Otterly.AI", href: "/vs/otterly" },
                { label: "vs AthenaHQ", href: "/vs/athenahq" },
                { label: "vs Profound", href: "/vs/profound" },
                { label: "vs Brandlight", href: "/vs/brandlight" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-5">Guides</h4>
            <ul className="space-y-3 text-sm">
              {[
                { label: "What is AEO?", href: "/what-is-answer-engine-optimization" },
                { label: "Rank in ChatGPT", href: "/how-to-rank-in-chatgpt" },
                { label: "Appear in AI Search", href: "/how-to-appear-in-ai-search" },
                { label: "Best AEO Tools", href: "/best-aeo-tools" },
                { label: "Best GEO Tools", href: "/best-geo-optimization-tools" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span>© {year} AEO Improvement. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
            <span className="text-gray-700">·</span>
            <span className="text-emerald-500 font-medium">aeoimprovement.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
