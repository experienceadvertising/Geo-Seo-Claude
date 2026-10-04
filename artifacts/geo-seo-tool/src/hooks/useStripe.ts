import { acceptedCheckoutUrl } from "@/lib/accepted-registration";
import { trackEvent } from "@/lib/analytics";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

interface Price {
  id: string;
  unitAmount: number;
  currency: string;
  recurring: { interval: string; interval_count: number } | null;
  metadata: Record<string, string>;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Price[];
}

export interface BillingSubscription {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;
  plan: "starter" | "pro" | "agency" | null;
}

export interface BillingStatus {
  subscription: BillingSubscription | null;
  plan: string;
  canManageBilling: boolean;
}

export function useStripeProducts() {
  return useQuery<{ data: Product[] }>({
    queryKey: ["stripe", "products"],
    queryFn: () => customFetch<{ data: Product[] }>("/api/stripe/products"),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useStripeSubscription() {
  const { isSignedIn } = useAuth();
  return useQuery<BillingStatus>({
    queryKey: ["stripe", "subscription"],
    queryFn: () => customFetch<BillingStatus>("/api/stripe/subscription"),
    enabled: isSignedIn,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCheckout() {
  const { toast } = useToast();
  return useMutation<{ url: string }, Error, { priceId: string; plan: string; billingInterval?: string }>({
    mutationFn: async ({ priceId, plan }) => {
      const result = await customFetch<{ url: string }>("/api/stripe/checkout", {
        method: "POST", body: JSON.stringify({ priceId, plan }),
      });
      const url = acceptedCheckoutUrl(result);
      if (!url) throw new Error("Checkout was not confirmed. Please try again.");
      return { url };
    },
    onSuccess: ({ url }, variables) => {
      try { trackEvent("checkout_started", { plan: variables.plan, billing_interval: variables.billingInterval }); } catch { /* Measurement must not block checkout. */ }
      window.location.href = url;
    },
    onError: (err) => {
      toast({
        title: "Checkout failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useCustomerPortal() {
  const { toast } = useToast();
  return useMutation<{ url: string }, Error, void>({
    mutationFn: () =>
      customFetch<{ url: string }>("/api/stripe/portal", { method: "POST" }),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
    onError: (err) => {
      toast({
        title: "Could not open billing portal",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
}
