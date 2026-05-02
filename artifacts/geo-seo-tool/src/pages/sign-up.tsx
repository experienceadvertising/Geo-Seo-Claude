import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { customFetch } from "@workspace/api-client-react";

export default function SignUpPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  // If the user is already signed in, send them to the dashboard rather than
  // showing the sign-up form.
  useEffect(() => {
    if (isLoaded && isSignedIn) setLocation("/");
  }, [isLoaded, isSignedIn, setLocation]);

  async function handleResend() {
    if (!email || resending) return;
    setResending(true);
    try {
      await customFetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResent(true);
    } catch { /* ignore — endpoint always returns success */ }
    finally { setResending(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await customFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ firstName, email, password }),
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.body?.error || err?.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <Card className="w-full max-w-[440px] shadow-xl border-slate-200">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold">Check your email</h2>
            <p className="text-muted-foreground text-sm">
              We sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
            </p>
            <p className="text-xs text-muted-foreground">
              The link will expire in 24 hours. Don't see it? Check your spam folder.
            </p>
            {resent ? (
              <p className="text-sm text-emerald-700">A new verification link has been sent.</p>
            ) : (
              <Button variant="outline" size="sm" onClick={handleResend} disabled={resending}>
                {resending ? "Sending…" : "Resend verification email"}
              </Button>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              Already verified?{" "}
              <Link href="/sign-in" className="text-emerald-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Avoid flashing the sign-up form for users who are already authenticated.
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
          <CardTitle className="text-2xl font-bold">Create your account</CardTitle>
          <CardDescription>Free — no credit card required</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="firstName">First name (optional)</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Alex"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating account…</> : "Create free account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-emerald-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
