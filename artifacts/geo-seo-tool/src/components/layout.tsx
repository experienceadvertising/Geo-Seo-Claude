import React from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, LogOut, Shield } from "lucide-react";
import { Show, useClerk, useUser, SignInButton, SignUpButton } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

function AdminLink() {
  const { user } = useUser();
  const { data } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["admin", "me"],
    queryFn: () => customFetch<{ isAdmin: boolean }>("/api/admin/me"),
    enabled: !!user,
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
  const { user } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  if (!user) return null;
  const label = user.primaryEmailAddress?.emailAddress || user.username || "Account";
  return (
    <div className="flex items-center gap-2">
      <span className="hidden sm:inline text-xs text-muted-foreground max-w-[200px] truncate">{label}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut(() => setLocation("/"))}
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Sign out</span>
      </Button>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
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
            <Show when="signed-in">
              <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">Audits</Link>
                <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              </nav>
              <AdminLink />
              <UserBadge />
            </Show>
            <Show when="signed-out">
              <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              </nav>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm">Get started</Button>
              </SignUpButton>
            </Show>
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
