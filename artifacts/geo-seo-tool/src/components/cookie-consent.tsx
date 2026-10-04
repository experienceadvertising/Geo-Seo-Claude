import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getTrackingConsent, setTrackingConsent, trackPageView } from "@/lib/analytics";

export function CookieConsent() {
  const [status, setStatus] = useState("");
  function choose(choice: "all" | "essential") {
    const previous = getTrackingConsent();
    setTrackingConsent(choice);
    if (choice === "all" && !previous?.analytics) trackPageView(window.location.pathname);
    setStatus(choice === "essential" ? "Optional tracking is off." : "Measurement is allowed.");
    if (previous?.analytics && choice === "essential") window.location.reload();
  }
  return (
    <section id="analytics-preferences" aria-label="Analytics preferences" className="my-8 rounded-xl border p-5">
      <h2 className="text-xl font-semibold">Analytics preferences</h2>
      <p className="my-3 text-sm">Choose whether to allow optional measurement. Essential storage keeps the product working.</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => choose("essential")}>Essential only</Button>
        <Button onClick={() => choose("all")}>Accept analytics and ads</Button>
      </div>
      <p role="status" className="mt-3 text-sm">{status}</p>
    </section>
  );
}
