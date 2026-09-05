import React, { useEffect } from "react";
import { nextImprovement, improvementLink } from "@/lib/nextImprovement";
import { Link, useLocation } from "wouter";
import { Sparkles, LogOut, Shield, Menu, LayoutDashboard, FolderKanban, CreditCard, BookOpen, CircleHelp, CheckCircle2, Search, SlidersHorizontal, MessageSquareText, Library } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { customFetch, getGetAuditQueryKey, getListAuditsQueryKey, useGetAudit, useListAudits } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { UsageMeter } from "@/components/usage-meter";
import { TrialBanner } from "@/components/trial-banner";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { shouldUseAppShell } from "@/lib/appRoute";

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
        className="h-11 w-11 p-0 sm:h-8 sm:w-auto sm:px-3"
        onClick={() => signOut().then(() => setLocation("/"))}
        title="Sign out"
        aria-label="Sign out"
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

  const isAppRoute = shouldUseAppShell(pathname, isSignedIn);

  if (isLoaded && isAppRoute) {
    return <AppShell pathname={pathname}>{children}</AppShell>;
  }

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
            {isLoaded && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[min(85vw,320px)]">
                  <SheetTitle>Navigation</SheetTitle>
                  <nav className="mt-8 flex flex-col gap-1">
                    {(isSignedIn
                      ? [["Audits", "/"], ["Projects", "/projects"], ["Methodology", "/methodology"], ["Pricing", "/pricing"], ["Contact", "/contact"]]
                      : [["Free AEO audit", "/free-aeo-audit-tool"], ["Methodology", "/methodology"], ["Pricing", "/pricing"], ["Sign in", "/sign-in"], ["Create account", "/sign-up"]]
                    ).map(([label, href]) => (
                      <SheetClose asChild key={href}><Link href={href} className="px-3 py-3 rounded-md text-sm font-medium hover:bg-muted">{label}</Link></SheetClose>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            )}
            {isLoaded && isSignedIn && (
              <>
                <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
                  <Link href="/" className="hover:text-foreground transition-colors">Audits</Link>
                  <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
                  <Link href="/methodology" className="hover:text-foreground transition-colors">Methodology</Link>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                  <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
                </nav>
                <TrialBanner />
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
                {/* Below `sm` the menu sheet carries "Sign in"; showing it
                    here too overflowed the header on phones. */}
                <Link href="/sign-in" className="hidden sm:inline-flex">
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

const APP_NAV = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Tracking", href: "/projects", icon: FolderKanban },
  { label: "Recommended tools", compactLabel: "Tools", href: "/recommended-tools", icon: Library },
  { label: "Plans", href: "/upgrade", icon: CreditCard },
];

const APP_SUPPORT_NAV = [
  { label: "Methodology", href: "/methodology", icon: BookOpen },
  { label: "Help", href: "/contact", icon: CircleHelp },
];

function AppNavLink({ label, compactLabel, href, icon: Icon, pathname, compact = false }: {
  label: string;
  compactLabel?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  compact?: boolean;
}) {
  const active = href === "/"
    ? pathname === "/" || pathname.startsWith("/results/") || pathname.startsWith("/simulate/")
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={compact
        ? `flex min-h-14 flex-1 flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium ${active ? "text-emerald-700" : "text-slate-500"}`
        : `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
    >
      <Icon className={compact ? "h-5 w-5" : "h-4 w-4"} />
      <span>{compact ? compactLabel ?? label : label}</span>
    </Link>
  );
}

function AuditResultsNav({ mobile = false }: { mobile?: boolean }) {
  const [pathname] = useLocation();
  const routeMatch = pathname.match(/^\/(?:results|simulate)\/(\d+)/);
  const currentAuditId = routeMatch ? Number(routeMatch[1]) : 0;
  const { data: audits } = useListAudits({ limit: 1 }, {
    query: { queryKey: getListAuditsQueryKey({ limit: 1 }), staleTime: 60_000, retry: false },
  });
  const selectedAuditId = currentAuditId || audits?.[0]?.id || 0;
  const { data: auditDetails } = useGetAudit(selectedAuditId, {
    query: { queryKey: getGetAuditQueryKey(selectedAuditId), enabled: selectedAuditId > 0, staleTime: 60_000, retry: false },
  });
  const audit = auditDetails ?? audits?.[0];

  let domain = audit?.url ?? "";
  try { domain = new URL(domain).hostname.replace(/^www\./, ""); } catch { /* keep stored URL */ }
  const { data: progress, isError: progressError, isLoading: progressLoading } = useQuery<{ completed: Array<{ recommendationId: string }> }>({
    queryKey: ["recommendation-progress", domain],
    queryFn: () => customFetch(`/api/geo/recommendation-progress?domain=${encodeURIComponent(domain)}`),
    enabled: !!domain && !!auditDetails?.recommendations?.length,
    staleTime: 30_000,
    retry: false,
  });
  if (!audit) return null;

  const completedIds = new Set((progress?.completed ?? []).map((item) => item.recommendationId));
  const nextRecommendation = nextImprovement(auditDetails?.recommendations, completedIds, progressError ? "error" : progressLoading ? "loading" : "ready").task;

  const links = [
    { label: "Overview", href: `/results/${audit.id}`, icon: LayoutDashboard },
    { label: "Top actions", href: `/results/${audit.id}#recommendations`, icon: CheckCircle2 },
    { label: "SEO opportunities", href: `/results/${audit.id}#seo-opportunities`, icon: Search },
    { label: "Prompt test", href: `/simulate/${audit.id}`, icon: MessageSquareText },
    { label: "Technical details", href: `/results/${audit.id}?details=1#technical-breakdown`, icon: SlidersHorizontal },
  ];

  return (
    <section className={mobile ? "mt-5 border-t pt-5" : "mt-4 border-t border-slate-100 pt-4"} aria-label="Latest audit results">
      <div className="mb-2 flex items-start justify-between gap-2 px-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Latest audit</p>
          <p className="truncate text-xs font-medium text-slate-700" title={domain}>{domain}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">{Math.round(audit.geoScore)}</span>
      </div>
      {nextRecommendation && (
        <Link href={improvementLink(selectedAuditId, nextRecommendation.id)} className="mx-2 mb-2 block rounded-lg border border-emerald-100 bg-emerald-50/70 p-3 hover:border-emerald-200 hover:bg-emerald-50">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Next improvement</p>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-800">{nextRecommendation.title}</p>
          <p className="mt-1 text-[11px] font-medium text-emerald-800">Open action plan</p>
        </Link>
      )}
      <div className="space-y-0.5">
        {links.map(({ label, href, icon: Icon }) => {
          const link = <Link href={href} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950">
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </Link>;
          return mobile ? <SheetClose asChild key={label}>{link}</SheetClose> : <React.Fragment key={label}>{link}</React.Fragment>;
        })}
      </div>
    </section>
  );
}

function AppShell({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans md:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-100 px-5 py-5">
          <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-950">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>AEO Improvement</span>
          </Link>
          <p className="mt-2 pl-10 text-[11px] font-medium uppercase tracking-wider text-emerald-700">SEO + GEO workspace</p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Application navigation">
          {APP_NAV.map((item) => <AppNavLink key={item.href} {...item} pathname={pathname} />)}
          <AuditResultsNav />
          <div className="my-4 border-t border-slate-100" />
          {APP_SUPPORT_NAV.map((item) => <AppNavLink key={item.href} {...item} pathname={pathname} />)}
          <AdminLink />
        </nav>

        <div className="space-y-3 border-t border-slate-100 p-4">
          <TrialBanner />
          <UsageMeter />
          <UserBadge />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:hidden">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-slate-950">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>AEO Improvement</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Open account navigation"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(85vw,320px)] overflow-y-auto">
              <SheetTitle>Account and support</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1">
                {APP_NAV.map(({ label, href, icon: Icon }) => (
                  <SheetClose asChild key={href}>
                    <Link href={href} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium hover:bg-muted"><Icon className="h-4 w-4" />{label}</Link>
                  </SheetClose>
                ))}
                <AuditResultsNav mobile />
                {APP_SUPPORT_NAV.map(({ label, href, icon: Icon }) => (
                  <SheetClose asChild key={href}>
                    <Link href={href} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium hover:bg-muted"><Icon className="h-4 w-4" />{label}</Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-6 border-t pt-4"><UserBadge /></div>
            </SheetContent>
          </Sheet>
        </header>

        <main className="min-h-screen pb-20 md:pb-0">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Primary application navigation">
          {APP_NAV.map((item) => <AppNavLink key={item.href} {...item} pathname={pathname} compact />)}
        </nav>
      </div>
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
              Guided SEO and GEO improvements for brands and agencies. Audit your site, choose the next fix, and measure what changes.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              One workspace for SEO and AI search
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
                { label: "AEO Software", href: "/aeo-software" },
                { label: "AI Visibility Software", href: "/ai-visibility-software" },
                { label: "Changelog", href: "/changelog" },
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
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link href="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="/google-data-use" className="hover:text-gray-300 transition-colors">Google data use</Link>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("aeo:open-cookie-settings"))}
              className="hover:text-gray-300 transition-colors"
            >
              Cookie settings
            </button>
            <span className="text-emerald-500 font-medium">aeoimprovement.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
