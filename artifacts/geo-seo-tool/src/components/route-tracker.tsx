import { useEffect } from "react";
import { useLocation } from "wouter";
import { initializeAnalytics, trackPageView } from "@/lib/analytics";

export function RouteTracker() {
  const [path] = useLocation();

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(path);
  }, [path]);

  return null;
}
