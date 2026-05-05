import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, MailX, MailCheck, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { customFetch } from "@workspace/api-client-react";

type Status = "loading" | "subscribed" | "unsubscribed" | "invalid" | "submitting";

export default function UnsubscribePage() {
  const [status, setStatus] = useState<Status>("loading");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const data = await customFetch<{ email: string | null; optedOut: boolean | null }>(
          `/api/auth/unsubscribe-info?token=${encodeURIComponent(token)}`,
        );
        // Server returns 200 + null for unknown tokens (so scrapers can't
        // distinguish valid vs invalid tokens by HTTP status).
        if (!data.email) {
          setStatus("invalid");
          return;
        }
        setEmail(data.email);
        setStatus(data.optedOut ? "unsubscribed" : "subscribed");
      } catch {
        setStatus("invalid");
      }
    })();
  }, [token]);

  async function handleUnsubscribe() {
    setStatus("submitting");
    setError(null);
    try {
      await customFetch("/api/auth/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setStatus("unsubscribed");
    } catch (err: any) {
      setError(err?.body?.error || err?.message || "Something went wrong. Please try again.");
      setStatus("subscribed");
    }
  }

  async function handleResubscribe() {
    setStatus("submitting");
    setError(null);
    try {
      await customFetch("/api/auth/resubscribe", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setStatus("subscribed");
    } catch (err: any) {
      setError(err?.body?.error || err?.message || "Something went wrong. Please try again.");
      setStatus("unsubscribed");
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <Helmet>
        <title>Email preferences — AEO Improvement</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <Card className="w-full max-w-[480px] shadow-xl border-slate-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white shadow-md">
              <Sparkles className="h-5 w-5" />
            </span>
          </div>
          <CardTitle className="text-2xl font-bold">Email preferences</CardTitle>
          <CardDescription>AEO Improvement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {status === "loading" && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          )}

          {status === "invalid" && (
            <div className="space-y-4 text-center">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                This unsubscribe link is invalid or has expired.
              </div>
              <p className="text-sm text-muted-foreground">
                You can manage your email preferences from your account settings, or email us at{" "}
                <a href="mailto:info@aeoimprovement.com" className="text-emerald-600 hover:underline">
                  info@aeoimprovement.com
                </a>
                .
              </p>
              <Link href="/">
                <Button variant="outline" className="w-full">Back to home</Button>
              </Link>
            </div>
          )}

          {(status === "subscribed" || status === "submitting") && email && (
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                You're currently subscribed to AEO Improvement marketing and digest emails as <strong>{email}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                Unsubscribing stops the welcome series, weekly digests, monthly reports, and product updates.
                You'll still receive transactional emails (password resets, billing notifications, security alerts).
              </p>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button
                onClick={handleUnsubscribe}
                disabled={status === "submitting"}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {status === "submitting" ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating…</>
                ) : (
                  <><MailX className="h-4 w-4 mr-2" /> Unsubscribe me</>
                )}
              </Button>
            </div>
          )}

          {status === "unsubscribed" && email && (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-2">
                <MailCheck className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  You've been unsubscribed. <strong>{email}</strong> will no longer receive marketing or digest emails from AEO Improvement.
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Changed your mind? You can resubscribe at any time.
              </p>
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <Button onClick={handleResubscribe} variant="outline" className="w-full">
                Resubscribe
              </Button>
              <Link href="/">
                <Button variant="ghost" className="w-full">Back to home</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
