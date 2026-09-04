import { ExternalLink, Megaphone, Newspaper, Mic, Globe2, Users, Youtube, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Authority Signals card recommends third-party discovery and publishing
 * channels that can help a brand earn legitimate coverage and references.
 *
 * We list a mix of paid and free channels, label them honestly, and link
 * out (target=_blank, rel=noopener) so users can evaluate each themselves.
 * No affiliate codes — these are recommendations, not partnerships.
 *
 * It lives on the authenticated Recommended tools page.
 */

interface Channel {
  name: string;
  href: string;
  icon: React.ReactNode;
  cost: "Paid" | "Free" | "Freemium";
  // Honest one-line description of what they actually offer
  what: string;
  // Why this helps for AEO/GEO specifically
  why: string;
}

const CHANNELS: Channel[] = [
  {
    name: "Linkby",
    href: "https://www.linkby.com/",
    icon: <Newspaper className="h-4 w-4" />,
    cost: "Paid",
    what: "A performance-based publisher network where brands set campaign budgets and pay for delivered engagement.",
    why: "Relevant editorial coverage can create discoverable third-party references, referral traffic, and brand context. Results depend on publisher fit and the quality of the coverage.",
  },
  {
    name: "Featured.com",
    href: "https://featured.com/",
    icon: <Megaphone className="h-4 w-4" />,
    cost: "Freemium",
    what: "Q&A platform where experts answer journalist and brand questions; selected answers get published with attribution.",
    why: "Useful, attributable expert answers can earn independent mentions and links. Publication and visibility are not guaranteed.",
  },
  {
    name: "PodMatch",
    href: "https://podmatch.com/",
    icon: <Mic className="h-4 w-4" />,
    cost: "Freemium",
    what: "Matches podcast guests with podcast hosts, similar to dating-app mechanics.",
    why: "Relevant interviews can create useful third-party context, branded searches, referral traffic, and crawlable transcripts when the publisher makes them available.",
  },
  {
    name: "Wikipedia / Wikidata",
    href: "https://en.wikipedia.org/wiki/Wikipedia:Notability_(organizations_and_companies)",
    icon: <Globe2 className="h-4 w-4" />,
    cost: "Free",
    what: "Reference projects with strict notability, neutrality, sourcing, and conflict-of-interest requirements.",
    why: "Use these only when the organization independently qualifies. Never create promotional entries or treat a thin listing as an optimization shortcut.",
  },
  {
    name: "Reddit",
    href: "https://www.reddit.com/",
    icon: <Users className="h-4 w-4" />,
    cost: "Free",
    what: "Authentic participation in communities relevant to your category. Do not use fake accounts or undisclosed promotion.",
    why: "Helpful discussions can build trust, surface real customer language, and create discoverable context. Participate for the community, not to manufacture mentions.",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/",
    icon: <Youtube className="h-4 w-4" />,
    cost: "Free",
    what: "Publish useful demos, walkthroughs, interviews, and explainers with accurate titles, descriptions, and transcripts.",
    why: "Video gives searchers and AI systems another public format for understanding products, methods, and expertise. Performance depends on usefulness and distribution.",
  },
];

export function AuthoritySignalsCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            Boost your authority signals
          </CardTitle>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-emerald-300 text-emerald-700">
            Off-site AEO
          </Badge>
        </div>
        <CardDescription className="text-xs leading-relaxed pt-1">
          Use these channels to pursue legitimate third-party coverage, expert contributions, and
          public brand context. They can support SEO and GEO, but none guarantees rankings, traffic,
          or AI citations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {CHANNELS.map((c) => (
          <a
            key={c.name}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-lg border bg-card p-3.5 hover:border-emerald-500/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{c.name}</div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-wider shrink-0 ${
                        c.cost === "Paid"
                          ? "border-amber-300 text-amber-700"
                          : c.cost === "Free"
                          ? "border-emerald-300 text-emerald-700"
                          : "border-slate-300 text-slate-600"
                      }`}
                    >
                      {c.cost}
                    </Badge>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-emerald-600 shrink-0" />
                </div>
                <div className="text-xs text-slate-600 mt-1 leading-relaxed">{c.what}</div>
                <div className="text-xs text-emerald-700 mt-1.5 leading-relaxed">
                  <span className="font-semibold">Why it helps:</span> {c.why}
                </div>
              </div>
            </div>
          </a>
        ))}
        <p className="text-[11px] text-muted-foreground pt-1 leading-relaxed">
          Disclosure: these are independent recommendations, not partnerships. We do not earn
          affiliate commissions from these links. Verify current pricing, eligibility, and fit
          directly with each provider before spending money.
        </p>
      </CardContent>
    </Card>
  );
}
