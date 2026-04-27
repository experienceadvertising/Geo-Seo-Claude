import { useMutation, useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
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

export function useStripeProducts() {
  return useQuery<{ data: Product[] }>({
    queryKey: ["stripe", "products"],
    queryFn: () => customFetch<{ data: Product[] }>("/api/stripe/products"),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useStripeSubscription() {
  const { user } = useUser();
  return useQuery<{ subscription: any; plan: string }>({
    queryKey: ["stripe", "subscription"],
    queryFn: () => customFetch<{ subscription: any; plan: string }>("/api/stripe/subscription"),
    enabled: !!user,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCheckout() {
  const { toast } = useToast();
  return useMutation<{ url: string }, Error, { priceId: string; plan: string }>({
    mutationFn: ({ priceId, plan }) =>
      customFetch<{ url: string }>("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ priceId, plan }),
      }),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
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
