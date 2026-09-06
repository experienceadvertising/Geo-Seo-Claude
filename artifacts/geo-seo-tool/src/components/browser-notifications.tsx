import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

type Status = { configured: boolean; subscribed: boolean; publicKey: string | null };

function applicationServerKey(value: string): Uint8Array {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const bytes = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bytes, char => char.charCodeAt(0));
}

export function BrowserNotifications() {
  const [status, setStatus] = useState<Status | null>(null);
  const [localSubscription, setLocalSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  useEffect(() => {
    if (!supported) return;
    Promise.all([
      customFetch<Status>("/api/notifications/status"),
      navigator.serviceWorker.register("/push-sw.js").then(registration => registration.pushManager.getSubscription()),
    ]).then(([nextStatus, subscription]) => { setStatus(nextStatus); setLocalSubscription(subscription); }).catch(() => setMessage("Notification settings could not be loaded."));
  }, [supported]);

  if (!supported) return null;
  if (!status && !message) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading notification settings…</div>;
  if (!status?.configured) return null;

  const enable = async () => {
    setBusy(true); setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage(permission === "denied"
          ? "This browser blocked notifications. Allow notifications for aeoimprovement.com in your browser's site settings, then try again."
          : "The notification prompt was closed without allowing access. Try again when you are ready.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription() ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(status.publicKey!) as BufferSource });
      await customFetch("/api/notifications/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      setLocalSubscription(subscription); setMessage("Notifications are enabled on this browser.");
    } catch { setMessage("Notifications could not be enabled. Check this browser's site permissions and try again."); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    if (!localSubscription) return;
    setBusy(true); setMessage("");
    try {
      await customFetch("/api/notifications/subscription", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: localSubscription.endpoint }) });
      await localSubscription.unsubscribe(); setLocalSubscription(null); setMessage("Notifications are off on this browser.");
    } catch { setMessage("Notifications could not be turned off. Please try again."); }
    finally { setBusy(false); }
  };

  return <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-4" aria-label="Browser notifications">
    <div className="flex min-w-0 items-start gap-3"><div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">{localSubscription ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}</div><div><h2 className="font-semibold">Next-task notifications</h2><p className="text-sm text-muted-foreground">Get important audit and monitoring updates, your next personalized task, and one weekly strategy from a named authority source. Notifications may show a short task or strategy title on this device's lock screen, but never page excerpts, scores, or search queries. You can turn this off anytime.</p>{message && <p className="mt-1 text-xs text-slate-600" role="status">{message}</p>}</div></div>
    <Button variant={localSubscription ? "outline" : "default"} disabled={busy} onClick={localSubscription ? disable : enable}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{localSubscription ? "Turn off on this browser" : "Enable notifications"}</Button>
  </section>;
}
