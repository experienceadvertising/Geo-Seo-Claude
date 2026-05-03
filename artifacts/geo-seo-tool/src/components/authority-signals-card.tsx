import { ExternalLink, Megaphone, Newspaper, Mic, Globe2, Users, Youtube, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Authority Signals card — recommends third-party citation channels that
 * boost AEO/GEO/SEO. AI engines weight off-site authority signals heavily
 * (the same E-E-A-T axes that traditional search uses), so getting cited,
 * quoted, and linked from authoritative third-party publishers is one of
 * the highest-leverage moves a brand can make.
 *
 * We list a mix of paid and free channels, label them honestly, and link
 * out (target=_blank, rel=noopener) so users can evaluate each themselves.
 * No affiliate codes — these are recommendations, not partnerships.
 *
 * Lives inside DashboardLearningHub on the home page, but exported for
 * potential reuse on a dedicated /authority page later.
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
    what: "Sponsored editorial placements on real publisher sites with editorial review (Forbes, BuzzFeed, etc).",
    why: "Citations from high-authority publishers train and reinforce how AI engines describe your brand. One placement compounds across multiple AI training cycles.",
  },
  {
    name: "Connectively (formerly HARO)",
    href: "https://connectively.us/",
    icon: <Megaphone className="h-4 w-4" />,
    cost: "Freemium",
    what: "Daily email of journalist queries looking for expert quotes. Reply with relevant expertise to get quoted.",
    why: "Free way to land in news articles, which AI engines treat as authoritative source material. Most replies don't land — but the ones that do compound for years.",
  },
  {
    name: "Featured.com",
    href: "https://featured.com/",
    icon: <Megaphone className="h-4 w-4" />,
    cost: "Freemium",
    what: "Q&A platform where experts answer journalist and brand questions; selected answers get published with attribution.",
    why: "Lower effort than HARO and the answer-based format is highly chunkable for AI engines that surface bite-size citations.",
  },
  {
    name: "PodMatch",
    href: "https://podmatch.com/",
    icon: <Mic className="h-4 w-4" />,
    cost: "Freemium",
    what: "Matches podcast guests with podcast hosts, similar to dating-app mechanics.",
    why: "Podcast transcripts are increasingly indexed by AI engines. A 45-min interview becomes a multi-citation source for years.",
  },
  {
    name: "Wikipedia / Wikidata",
    href: "https://en.wikipedia.org/wiki/Wikipedia:Notability_(organizations_and_companies)",
    icon: <Globe2 className="h-4 w-4" />,
    cost: "Free",
    what: "Build a notability case (independent press coverage, etc), then either propose an article or wait for a third-party editor to create one.",
    why: "Wikipedia is one of the most heavily-weighted sources in every major LLM's training data. Even a stub entry significantly impacts how AI describes your brand.",
  },
  {
    name: "Reddit",
    href: "https://www.reddit.com/",
    icon: <Users className="h-4 w-4" />,
    cost: "Free",
    what: "Authentic participation in subreddits relevant to your category (NOT astroturfing — that gets you banned and torched in AI engines).",
    why: "Reddit is heavily cited by Perplexity and ChatGPT for opinion-style queries. A genuinely helpful comment thread can outrank a marketing page.",
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/",
    icon: <Youtube className="h-4 w-4" />,
    cost: "Free",
    what: "Publish demos, walkthroughs, and explainers; transcripts are auto-generated and indexed.",
    why: "Google AI Overviews and Gemini draw heavily from YouTube transcripts. A good 8-min walkthrough beats a written blog post for AI surfacing in many categories.",
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
          AI engines weight third-party citations heavily — getting quoted, cited, or linked from
          authoritative publishers is one of the highest-leverage moves you can make. These are
          the channels we'd actually recommend.
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
          Disclosure: these are recommendations, not partnerships. We don't earn affiliate
          commissions on any of these links.
        </p>
      </CardContent>
    </Card>
  );
}
