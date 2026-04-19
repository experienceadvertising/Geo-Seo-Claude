import React from "react";
import { Link } from "wouter";
import { Activity, LayoutDashboard, Settings } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="flex mr-4 items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <Activity className="h-5 w-5 text-primary" />
              <span>GEO SEO</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
            </div>
            <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Audits</Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
