import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { customFetch } from "@workspace/api-client-react";
import { apiErrorCode, apiErrorMessage } from "@/lib/api-error";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const { refresh } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setErrorCode("missing_token");
      setMessage("Missing verification token. Please use the link from your email.");
      return;
    }
    customFetch<{ sessionStarted?: boolean }>(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (data) => {
        if (data.sessionStarted) {
          await refresh();
          setStatus("success");
          setMessage("Your email is verified. You are signed in and we are taking you to your dashboard.");
          window.setTimeout(() => setLocation("/"), 1200);
          return;
        }
        setStatus("success");
        setMessage("Your email is verified. Please sign in to continue.");
      })
      .catch((err: unknown) => {
        setStatus("error");
        setErrorCode(apiErrorCode(err));
        setMessage(apiErrorMessage(err, "We couldn't verify this link. Request a new one and try again."));
      });
  }, []);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    if (!resendEmail || resending) return;
    setResending(true);
    try {
      await customFetch("/api/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email: resendEmail }),
      });
      setResent(true);
    } catch { /* endpoint always returns success */ }
    finally { setResending(false); }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <Helmet>
        <title>Verify email — AEO Improvement</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Card className="w-full max-w-[440px] shadow-xl border-slate-200">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-14 w-14 text-emerald-500 mx-auto animate-spin" />
              <h2 className="text-xl font-bold">Verifying your email…</h2>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold">Email verified!</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
              {message.includes("signed in") ? (
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setLocation("/")}>
                  Continue to dashboard
                </Button>
              ) : (
                <Link href="/sign-in">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">Sign in now</Button>
                </Link>
              )}
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-14 w-14 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold">Verification failed</h2>
              <p className="text-muted-foreground text-sm">{message}</p>

              {errorCode === "invalid_token" && (
                <p className="text-xs text-muted-foreground">
                  This often means the link has already been used. Try signing in
                  with the account you created.
                </p>
              )}

              {/* Inline resend form: never make the user navigate away just to
                  request a new verification email. */}
              {resent ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                  If that email is registered and unverified, a new link has been sent.
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-3 text-left pt-2">
                  <Label htmlFor="resend-email" className="text-sm">
                    Send a new verification link
                  </Label>
                  <Input
                    id="resend-email"
                    type="email"
                    placeholder="you@example.com"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    disabled={resending || !resendEmail}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {resending ? "Sending…" : "Send new link"}
                  </Button>
                </form>
              )}

              <div className="flex items-center justify-center gap-3 pt-2 text-xs">
                <Link href="/sign-in" className="text-emerald-600 hover:underline">
                  Sign in
                </Link>
                <span className="text-muted-foreground">·</span>
                <Link href="/sign-up" className="text-emerald-600 hover:underline">
                  Create account
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
