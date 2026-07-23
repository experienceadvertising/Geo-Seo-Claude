import React, { useState } from "react";
import { Copy, Check, Twitter, Linkedin, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customFetch } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  stats: {
    pendingRewards: number;
    paidRewards: number;
    totalEarnedDollars: number;
  };
}

export function ReferralCard() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery<ReferralData>({
    queryKey: ["referral"],
    queryFn: () => customFetch("/api/referral"),
    staleTime: 5 * 60 * 1000,
  });

  function handleCopy() {
    if (!data?.referralLink) return;
    navigator.clipboard.writeText(data.referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function shareOnTwitter() {
    if (!data?.referralLink) return;
    const text = encodeURIComponent(
      `I've been using AEO Improvement to optimize my site for AI search. Check it out — free to start: ${data.referralLink}`
    );
    window.open(`https://x.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
  }

  function shareOnLinkedIn() {
    if (!data?.referralLink) return;
    const url = encodeURIComponent(data.referralLink);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener,noreferrer");
  }

  const totalEarned = data?.stats.totalEarnedDollars ?? 0;
  const pending = data?.stats.pendingRewards ?? 0;

  return (
    <Card className="border-emerald-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Gift className="h-4 w-4 text-emerald-600" />
          Earn $25 per referral
        </CardTitle>
        <CardDescription className="text-xs">
          Share your link. When someone you refer upgrades to a paid plan, you get $25 as a credit on your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="h-10 rounded-lg bg-muted/50 animate-pulse" />
        ) : isError || !data?.referralLink ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p>We could not load your referral link.</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <Input
                readOnly
                value={data?.referralLink ?? ""}
                aria-label="Your referral link"
                className="text-sm font-mono bg-muted/40 text-muted-foreground"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                aria-label="Copy referral link"
                className="flex-shrink-0 gap-1.5"
              >
                {copied ? (
                  <><Check className="h-3.5 w-3.5 text-emerald-600" /> Copied</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={shareOnTwitter}
              >
                <Twitter className="h-3.5 w-3.5" />
                Share on X
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={shareOnLinkedIn}
              >
                <Linkedin className="h-3.5 w-3.5" />
                Share on LinkedIn
              </Button>
            </div>

            {(totalEarned > 0 || pending > 0) && (
              <div className="rounded-lg bg-emerald-500/8 border border-emerald-500/20 px-4 py-3 flex items-center justify-between gap-4">
                {totalEarned > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground">Earned</div>
                    <div className="text-lg font-bold text-emerald-700">${totalEarned.toFixed(0)}</div>
                  </div>
                )}
                {pending > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                    <div className="text-lg font-bold">{pending} {pending === 1 ? "reward" : "rewards"}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
