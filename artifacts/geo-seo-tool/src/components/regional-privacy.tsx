import { useEffect, useState } from "react";

type Region = "US" | "NON_US" | "UNKNOWN";
let regionRequest: Promise<Region> | undefined;

function readRegion(): Promise<Region> {
  if (!regionRequest) {
    regionRequest = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      try {
        const response = await fetch("https://site-privacy-region-evan.experienceadvertising.workers.dev/region", {
          credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer", signal: controller.signal,
        });
        if (!response.ok) return "UNKNOWN";
        const data = await response.json();
        return data?.region === "US" ? "US" : data?.region === "NON_US" ? "NON_US" : "UNKNOWN";
      } catch { return "UNKNOWN"; }
      finally { clearTimeout(timer); }
    })();
  }
  return regionRequest;
}

// Only controls automatic prompt presentation. Does not grant consent or load tags.
export function useAutomaticPrivacyPrompt() {
  const [region, setRegion] = useState<Region | null>(null);
  useEffect(() => {
    let active = true;
    void readRegion().then(value => { if (active) setRegion(value); });
    return () => { active = false; };
  }, []);
  return region !== null && region !== "US";
}

export function PrivacyChoicesFooter({ onOpen }: { onOpen: () => void }) {
  return <div className="border-t border-border bg-background px-4 py-3 text-center">
    <button type="button" onClick={onOpen} className="text-xs text-muted-foreground underline underline-offset-4">Privacy choices</button>
  </div>;
}
