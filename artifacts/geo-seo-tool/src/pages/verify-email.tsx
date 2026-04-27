import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { customFetch } from "@workspace/api-client-react";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token. Please use the link from your email.");
      return;
    }
    customFetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setStatus("success");
        setMessage("Your email is verified! You can now sign in.");
      })
      .catch((err: any) => {
        setStatus("error");
        setMessage(err?.body?.error || "Invalid or expired link. Please request a new verification email.");
      });
  }, []);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
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
              <Link href="/sign-in">
                <Button className="bg-emerald-600 hover:bg-emerald-700">Sign in now</Button>
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle className="h-14 w-14 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold">Verification failed</h2>
              <p className="text-muted-foreground text-sm">{message}</p>
              <Link href="/sign-up">
                <Button variant="outline">Back to sign up</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
