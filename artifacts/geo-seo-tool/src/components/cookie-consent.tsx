import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getTrackingConsent, setTrackingConsent, trackPageView } from "@/lib/analytics";

export function CookieConsent() {
  const [decided, setDecided] = useState(() => getTrackingConsent() !== null);

  useEffect(() => {
    const openSettings = () => setDecided(false);
    window.addEventListener("aeo:open-cookie-settings", openSettings);
    return () => window.removeEventListener("aeo:open-cookie-settings", openSettings);
  }, []);

  if (decided) return null;

  function choose(choice: "all" | "essential") {
    const previous = getTrackingConsent();
    setTrackingConsent(choice);
    if (choice === "all") {
      trackPageView(window.location.pathname + window.location.search);
    }
    setDecided(true);
    if (previous?.analytics && choice === "essential") window.location.reload();
  }

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl sm:bottom-5 sm:p-5"
      role="dialog"
      aria-label="Cookie preferences"
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-900">Your privacy choices</p>
          <p className="text-xs leading-relaxed text-slate-600">
            We use essential storage to operate the product. With your permission, we also use
            analytics and advertising tags to understand which campaigns lead to useful audits.
            Read our{" "}
            <Link href="/privacy" className="font-medium text-emerald-700 hover:underline">
              Privacy Policy
            </Link>.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" onClick={() => choose("essential")}>
            Essential only
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => choose("all")}>
            Accept analytics and ads
          </Button>
        </div>
      </div>
    </div>
  );
}
