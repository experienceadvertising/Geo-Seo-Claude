import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { customFetch } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getNextPath(): string {
  // Read ?next=... from the URL. Restrict to same-origin paths to avoid open
  // redirect vulnerabilities — only allow values that start with "/".
  const raw = new URLSearchParams(window.location.search).get("next");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  // Strip BASE prefix if present so wouter receives a router-relative path.
  if (BASE && raw.startsWith(BASE + "/")) return raw.slice(BASE.length) || "/";
  return raw;
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [resent, setResent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refresh, isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  // Send already-signed-in users to wherever they were headed (or home).
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation(getNextPath());
    }
  }, [isLoaded, isSignedIn, setLocation]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setLoading(true);
    try {
      await customFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      setLocation(getNextPath());
    } catch (err: any) {
      if (err?.body?.code === "email_not_verified") {
        setUnverified(true);
      } else {
        setError(err?.body?.error || err?.message || "Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      await customFetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch { /* ignore */ }
  }

  // While we are still figuring out whether the visitor is logged in, render
  // nothing — this avoids a flash of the sign-in form for already-signed-in
  // users.
  if (!isLoaded || isSignedIn) return null;

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <Card className="w-full max-w-[440px] shadow-xl border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>Welcome back to AEO Improvement</CardDescription>
        </CardHeader>
        <CardContent>
          {unverified ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                Please verify your email before signing in. Check your inbox for the verification link.
              </div>
              {resent ? (
                <p className="text-sm text-emerald-700 text-center">A new verification link has been sent!</p>
              ) : (
                <Button variant="outline" className="w-full" onClick={handleResend}>
                  Resend verification email
                </Button>
              )}
              <Button variant="ghost" className="w-full" onClick={() => setUnverified(false)}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Signing in…</> : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/sign-up" className="text-emerald-600 font-medium hover:underline">
                  Sign up free
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
