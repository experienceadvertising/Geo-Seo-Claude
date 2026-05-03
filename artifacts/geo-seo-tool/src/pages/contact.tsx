import { useEffect, useState } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { customFetch } from "@workspace/api-client-react";

export default function ContactPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot — must stay empty. Real users never see this field.
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await customFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, website }),
      });
      setDone(true);
    } catch (err: any) {
      setError(err?.message || "Could not send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Contact — AEO Improvement</title>
        <meta name="description" content="Get in touch with the AEO Improvement team about audits, simulations, billing, or partnerships." />
      </Helmet>

      <div className="mb-8 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white mb-4">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Contact us</h1>
        <p className="text-muted-foreground mt-2">
          Questions about audits, billing, or anything else — we read every message.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send a message</CardTitle>
          <CardDescription>We typically reply within one business day.</CardDescription>
        </CardHeader>
        <CardContent>
          {done ? (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-lg">Message sent</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Thanks for reaching out. We'll reply to <strong>{email}</strong> shortly.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                onClick={() => {
                  setMessage("");
                  setDone(false);
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={120}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  required
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  maxLength={5000}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {message.length} / 5000
                </div>
              </div>
              {/* Honeypot — visually hidden, off-screen, aria-hidden, autocomplete off.
                  Bots fill every input; humans never touch this. */}
              <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
                <label>
                  Website
                  <input
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </label>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send message"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Or email us directly at{" "}
                <a href="mailto:info@aeoimprovement.com" className="underline hover:text-foreground">
                  info@aeoimprovement.com
                </a>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
