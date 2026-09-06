import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { customFetch } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

type Preferences = { tasksEnabled: boolean; monitoringEnabled: boolean; strategiesEnabled: boolean; lastError?: string | null };
type Status = { configured: boolean; subscribed: boolean; publicKey: string | null; preferences?: Preferences | null };

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
  const load = async () => {
    const registration = await navigator.serviceWorker.register("/push-sw.js");
    const subscription = await registration.pushManager.getSubscription();
    const nextStatus = await customFetch<Status>("/api/notifications/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: subscription?.endpoint }) });
    setStatus(nextStatus); setLocalSubscription(subscription);
  };

  useEffect(() => {
    if (!supported) return;
    const refresh = () => load().catch(() => setMessage("Notification settings could not be loaded. Try again before changing your preferences."));
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [supported]);

  if (!supported) return null;
  if (!status && !message) return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading notification settings…</div>;
  if (!status) return <div role="status" className="rounded-lg border p-4 text-sm">{message}<Button variant="outline" onClick={() => load().catch(() => setMessage("Settings are still unavailable. Please try again later."))}>Retry settings</Button></div>;
  if (!status.configured) return <p className="text-sm text-muted-foreground">Browser notifications are temporarily unavailable. Your tasks are still available in the Action Plan.</p>;
  const enabled = Boolean(status.subscribed && localSubscription && Notification.permission === "granted");

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
      const existing = await registration.pushManager.getSubscription();
      // Explicit enable can replace a stale subscription, but never silently
      // transfers another account's endpoint to this account.
      if (existing && !status.subscribed) await existing.unsubscribe();
      const subscription = (status.subscribed ? existing : null) ?? await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationServerKey(status.publicKey!) as BufferSource });
      await customFetch("/api/notifications/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      await load(); setMessage("Notifications are enabled for this account on this browser.");
    } catch { setMessage("Notifications could not be enabled. Check this browser's site permissions and try again."); }
    finally { setBusy(false); }
  };

  const disable = async () => {
    if (!localSubscription) return;
    setBusy(true); setMessage("");
    try {
      await customFetch("/api/notifications/subscription", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: localSubscription.endpoint }) });
      await localSubscription.unsubscribe(); await load(); setMessage("Notifications are off on this browser.");
    } catch { setMessage("Notifications could not be turned off. Please try again."); }
    finally { setBusy(false); }
  };

  const savePreferences = async (next: Preferences) => {
    setBusy(true); setMessage("");
    try {
      await customFetch("/api/notifications/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: localSubscription?.endpoint, ...next }) });
      await load(); setMessage("Notification preferences saved. Email preferences are separate.");
    } catch { setMessage("Preferences were not saved. Please try again."); }
    finally { setBusy(false); }
  };
  return <details className="rounded-xl border bg-white p-4" aria-label="Browser notifications">
    <summary className="cursor-pointer font-semibold">Browser updates: {enabled ? "on for this account" : "off for this account"}</summary>
    <div className="mt-3 space-y-3">
      <p className="text-sm text-muted-foreground">Choose which updates bring you back to your work. Short task titles can appear on your lock screen. Page excerpts, scores and search queries are not included.</p>
      {localSubscription && !enabled && <p className="text-sm">This browser's saved subscription is not active for this account. Enable it here to reconnect.</p>}
      {enabled && status.preferences && <fieldset className="space-y-2" disabled={busy}><legend className="text-sm font-medium">Send me</legend>{([ ["tasksEnabled", "Audit results and my next task"], ["monitoringEnabled", "Important monitoring changes"], ["strategiesEnabled", "Weekly strategy reminders"] ] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={status.preferences![key]} onChange={event => savePreferences({ ...status.preferences!, [key]: event.target.checked })} />{label}</label>)}</fieldset>}
      {status.preferences?.lastError && <p className="text-sm">The last delivery attempt failed. Your tasks remain available in the dashboard.</p>}
      {message && <p className="text-sm" role="status">{message}</p>}
      <Button variant={enabled ? "outline" : "default"} disabled={busy} onClick={enabled ? disable : enable}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{enabled ? "Turn off on this browser" : "Enable for this account"}</Button>
    </div>
  </details>;
}
