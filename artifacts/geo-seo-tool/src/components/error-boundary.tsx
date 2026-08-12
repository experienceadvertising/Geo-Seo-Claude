import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportClientError } from "@/lib/error-reporting";

export class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) {
    console.error("Application render failed", error);
    reportClientError("render_error", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-600 mx-auto" />
          <h1 className="text-xl font-semibold">This page could not load</h1>
          <p className="text-sm text-muted-foreground">Your data is safe. Reload the page to try the request again.</p>
          <Button onClick={() => window.location.reload()}><RefreshCw className="h-4 w-4 mr-2" />Reload</Button>
        </div>
      </main>
    );
  }
}
