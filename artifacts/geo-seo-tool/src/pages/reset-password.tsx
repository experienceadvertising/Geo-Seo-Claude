import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Loader2, CheckCircle2, Check, X } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { customFetch } from "@workspace/api-client-react";
import { apiErrorMessage } from "@/lib/api-error";

const NoIndex = () => (
  <Helmet>
    <title>New password — AEO Improvement</title>
    <meta name="robots" content="noindex,nofollow" />
  </Helmet>
);

interface PasswordCheck {
  ok: boolean;
  label: string;
}

function passwordChecks(pw: string): PasswordCheck[] {
  return [
    { ok: pw.length >= 8, label: "At least 8 characters" },
    { ok: /[A-Za-z]/.test(pw) && /\d/.test(pw), label: "Contains letters and numbers" },
    { ok: !/^password|12345|qwerty/i.test(pw), label: "Not a common password" },
  ];
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = new URLSearchParams(window.location.search).get("token");
  const checks = useMemo(() => passwordChecks(password), [password]);
  const allOk = checks.every((c) => c.ok);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (!allOk) {
      setError("Please choose a stronger password.");
      return;
    }
    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await customFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (err: unknown) {
      setError(apiErrorMessage(err, "Reset failed. The link may have expired."));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <NoIndex />
        <Card className="w-full max-w-[440px] shadow-xl">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <p className="text-muted-foreground">Invalid reset link. Please request a new one.</p>
            <Link href="/forgot-password"><Button variant="outline">Request reset</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <NoIndex />
        <Card className="w-full max-w-[440px] shadow-xl border-slate-200">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold">Password updated!</h2>
            <p className="text-muted-foreground text-sm">You can now sign in with your new password.</p>
            <Link href="/sign-in"><Button className="bg-emerald-600 hover:bg-emerald-700">Sign in</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <NoIndex />
      <Card className="w-full max-w-[440px] shadow-xl border-slate-200">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold">Choose a new password</CardTitle>
          <CardDescription>Enter and confirm your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
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
              {password.length > 0 && (
                <ul className="space-y-1 pt-1">
                  {checks.map((c) => (
                    <li
                      key={c.label}
                      className={`flex items-center gap-1.5 text-xs ${c.ok ? "text-emerald-700" : "text-muted-foreground"}`}
                    >
                      {c.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      {c.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                aria-invalid={confirm.length > 0 && confirm !== password}
              />
              {confirm.length > 0 && confirm !== password && (
                <p className="text-xs text-red-600">Passwords don't match.</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={loading || !allOk || password !== confirm}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating…</> : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
