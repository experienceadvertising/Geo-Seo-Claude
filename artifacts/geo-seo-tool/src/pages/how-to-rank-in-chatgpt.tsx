import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Bot, Globe, FileCode, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { AUTHOR_PERSON_LD, PRIMARY_AUTHOR, PUBLISHER_ORG } from "@/data/author";

const PAGE_TITLE = "How to Rank in ChatGPT: Get Your Site Cited in AI Answers (2026)";
const PAGE_DESC =
  "A practical guide to getting your website cited by ChatGPT search. Covers GPTBot access, entity recognition, structured data, robots.txt strategy, and how to audit your current ChatGPT visibility.";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does ChatGPT decide which websites to cite?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ChatGPT's search feature uses two bots: OAI-SearchBot for real-time retrieval and GPTBot for training data. For live citations, OAI-SearchBot must be able to crawl your page, your content must be structured so it can be extracted as a direct answer, and your brand must have sufficient entity recognition in the model's knowledge graph. Pages that are JavaScript-rendered without server-side fallback, blocked in robots.txt, or lacking structured data are frequently skipped.",
      },
    },
    {
      "@type": "Question",
      name: "Does blocking GPTBot stop ChatGPT from citing my site?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Blocking GPTBot stops your content from being used in model training data, but it does not stop ChatGPT's real-time search from citing you. Real-time citations are handled by OAI-SearchBot, which is a separate user-agent. You can block GPTBot (training) while allowing OAI-SearchBot (live search) — these are independent choices with different consequences.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to start appearing in ChatGPT answers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "For real-time ChatGPT search citations, changes can take effect within days of OAI-SearchBot recrawling your page. Entity recognition in the underlying model changes much more slowly, since it depends on training cycles. Most practitioners see measurable improvement in citation frequency within four to eight weeks of implementing the on-site and off-site changes described in this guide.",
      },
    },
    {
      "@type": "Question",
      name: "What structured data matters most for ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "FAQPage schema is the highest-leverage structured data for ChatGPT citations because it maps directly to the question-and-answer format ChatGPT returns to users. Organization schema with sameAs links helps with entity recognition. Article schema with dateModified helps ChatGPT assess freshness. HowTo schema is useful for procedural content.",
      },
    },
    {
      "@type": "Question",
      name: "Can small or newer sites rank in ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, but entity recognition is the main barrier for newer brands. ChatGPT tends to cite sources it already recognizes. Building presence on Wikipedia, industry publications, Reddit, and LinkedIn before expecting citation frequency to rise is the most reliable path for newer sites. Technical fixes (robots.txt, schema, server-side rendering) are necessary but not sufficient if the brand has low entity recognition.",
      },
    },
  ],
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: PAGE_TITLE,
  description: PAGE_DESC,
  datePublished: "2026-05-05",
  dateModified: "2026-05-05",
  author: AUTHOR_PERSON_LD,
  publisher: PUBLISHER_ORG,
  mainEntityOfPage: { "@type": "WebPage", "@id": "https://aeoimprovement.com/how-to-rank-in-chatgpt" },
};

const breadcrumb = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Guides", path: "/what-is-answer-engine-optimization" },
  { name: "How to rank in ChatGPT", path: "/how-to-rank-in-chatgpt" },
]);

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5 items-start">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
      <span className="text-slate-700 text-sm leading-relaxed">{children}</span>
    </li>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
        <div className="text-sm text-slate-600 leading-relaxed space-y-2">{children}</div>
      </div>
    </div>
  );
}

export default function HowToRankInChatGPT() {
  return (
    <>
      <SEO
        title={PAGE_TITLE}
        description={PAGE_DESC}
        path="/how-to-rank-in-chatgpt"
        ogType="article"
        publishedTime="2026-05-05"
        modifiedTime="2026-05-05"
        authorName={PRIMARY_AUTHOR.name}
        jsonLd={[articleJsonLd, faqJsonLd, breadcrumb]}
      />
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Hero */}
          <header className="space-y-4">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" /> ChatGPT Search Optimization · Updated May 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              How to rank in ChatGPT: get your site cited in AI answers
            </h1>
            <p className="text-sm text-slate-500">
              By <a href={PRIMARY_AUTHOR.url} rel="author" className="text-emerald-700 hover:underline font-medium">{PRIMARY_AUTHOR.name}</a>, {PRIMARY_AUTHOR.jobTitle} · Updated May 5, 2026
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              ChatGPT now answers questions with citations from the live web. This guide covers
              exactly how the citation process works, what prevents most sites from appearing,
              and the specific changes that move the needle fastest.
            </p>
          </header>

          {/* TL;DR */}
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="pt-6 pb-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Key takeaway</div>
              <p className="text-slate-800 leading-relaxed text-sm">
                ChatGPT citations depend on three independent factors: crawler access (OAI-SearchBot must not
                be blocked), content extractability (server-side rendered, structured, direct-answer format),
                and entity recognition (the model must already know your brand exists). Most sites fail on
                one of the first two and don't realize it. Fix those before touching your content strategy.
              </p>
              <div className="pt-1">
                <Link href="/sign-up">
                  <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0">
                    Audit your ChatGPT visibility free <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* How ChatGPT search works */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">How ChatGPT search actually works</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              ChatGPT uses two separate systems when it cites your site, and most guides conflate them.
              Understanding the difference is the first step to fixing your visibility.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-slate-200">
                <CardContent className="pt-5 pb-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-sky-600" />
                    <span className="font-semibold text-sm">OAI-SearchBot</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">Real-time citations</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Crawls your page at query time to retrieve current content for live search responses.
                    This is the bot that produces citations in ChatGPT answers today.
                    Blocking it means you will not appear in real-time results, regardless of content quality.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200">
                <CardContent className="pt-5 pb-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-sm">GPTBot</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">Model training</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Collects data for model training, not live search. Blocking GPTBot is a legitimate
                    choice if you prefer not to contribute to training data. It does not prevent ChatGPT
                    from citing you in search results.
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Many sites block all OpenAI bots via a single <code className="bg-slate-100 px-1 rounded text-xs">User-agent: *</code> rule
              and wonder why they never appear in ChatGPT answers. Check your robots.txt before anything else.
            </p>
          </section>

          {/* The 6 factors */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">The factors that determine if ChatGPT cites you</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              Based on practitioner research and our own audit corpus, these are the signals that
              most reliably predict citation frequency:
            </p>
            <ul className="space-y-3">
              <Bullet>
                <strong>Crawler access.</strong> OAI-SearchBot must be explicitly allowed or not blocked.
                Check <code className="bg-slate-100 px-1 rounded text-xs">yourdomain.com/robots.txt</code> and
                search for OAI-SearchBot.
              </Bullet>
              <Bullet>
                <strong>Server-side rendering.</strong> ChatGPT's crawlers do not reliably execute JavaScript.
                If your page requires JS to display the content a user sees, the crawler sees an empty shell.
                View Source and check that your main content is present in the raw HTML.
              </Bullet>
              <Bullet>
                <strong>Direct-answer structure.</strong> AI engines lift the paragraph that most directly
                answers a question. Each major section of your content should open with a 2-3 sentence
                answer, not a setup paragraph.
              </Bullet>
              <Bullet>
                <strong>Entity recognition.</strong> ChatGPT selects from brands it already recognizes.
                If the model's knowledge graph does not associate your brand with a topic, on-page changes
                have limited effect. Off-site signals — Wikipedia, LinkedIn, industry press — build this.
              </Bullet>
              <Bullet>
                <strong>Structured data.</strong> FAQPage, Organization, and Article schema give ChatGPT
                explicit signals about what your page contains and who you are.
              </Bullet>
              <Bullet>
                <strong>Content freshness.</strong> ChatGPT search weights recently-updated pages for
                time-sensitive queries. Keep your <code className="bg-slate-100 px-1 rounded text-xs">dateModified</code> in
                Article schema accurate.
              </Bullet>
            </ul>
          </section>

          {/* Step-by-step */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Step-by-step: what to fix and in what order</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Work through these in order. Steps 1 and 2 are quick checks that block everything else
              if they fail. Steps 3 through 6 compound over time.
            </p>
            <div className="space-y-6">
              <Step number={1} title="Audit your robots.txt">
                <p>
                  Open <code className="bg-slate-100 px-1 rounded text-xs">yourdomain.com/robots.txt</code> in a browser.
                  Search the page for "OAI-SearchBot", "GPTBot", and any wildcard <code className="bg-slate-100 px-1 rounded text-xs">User-agent: *</code> rules
                  that might be blocking all bots.
                </p>
                <p>
                  Decide deliberately: allow OAI-SearchBot for live citations, block GPTBot for training
                  if you prefer. These are independent lines. Most sites should allow both.
                </p>
              </Step>
              <Step number={2} title="Check that your content is crawlable">
                <p>
                  In your browser, right-click your most important page and choose View Page Source
                  (not Inspect Element). Search for your main value proposition or a key sentence from
                  the page.
                </p>
                <p>
                  If it's not there, your content depends on JavaScript to render. You need server-side
                  rendering or static generation for at least the above-the-fold content.
                </p>
              </Step>
              <Step number={3} title="Add FAQPage schema to your top page">
                <p>
                  Choose your single highest-traffic or highest-intent page. Write 5 to 8 questions
                  in the exact phrasing your customers use, with concise direct-answer text for each.
                  Wrap them in FAQPage JSON-LD and add it to the page head.
                </p>
                <p>
                  Validate with Google's Rich Results Test before publishing.
                </p>
              </Step>
              <Step number={4} title="Add Organization schema with entity links">
                <p>
                  Add Organization JSON-LD to your homepage or root layout. Include <code className="bg-slate-100 px-1 rounded text-xs">sameAs</code> links
                  pointing to your Wikipedia article, LinkedIn company page, Crunchbase profile, and X handle.
                  This tells AI engines that these separate profiles all represent the same entity.
                </p>
              </Step>
              <Step number={5} title="Restructure content for direct-answer extraction">
                <p>
                  For each major section of content on your key pages, check whether the opening
                  paragraph immediately answers the heading as a question. Rewrite sections that build
                  context before the answer — lead with the answer, then explain.
                </p>
              </Step>
              <Step number={6} title="Build off-site entity signals">
                <p>
                  Get a Wikipedia article for your brand if you meet notability guidelines. Publish
                  original data or research that can be cited by industry publications. Be present
                  in the Reddit communities where your customers discuss their problems.
                </p>
                <p>
                  These signals take longer but create a compounding effect on how AI engines perceive
                  your brand's authority on a topic.
                </p>
              </Step>
            </div>
          </section>

          {/* What to measure */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">How to measure your ChatGPT citation rate</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Citation visibility in AI engines is less stable than traditional search rankings. Research
              shows that between 40% and 60% of cited sources rotate month-to-month across major AI platforms.
              This means a single check is not meaningful — you need regular tracking.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <FileCode className="h-4 w-4 text-emerald-600" />,
                  title: "Manual prompt testing",
                  body: "Query ChatGPT with the exact questions your customers ask. Note which brands appear. Free but not scalable.",
                },
                {
                  icon: <Globe className="h-4 w-4 text-sky-600" />,
                  title: "AEO score tracking",
                  body: "Run a structured audit to see your crawler access, schema, and entity signal gaps. Repeat monthly to track progress.",
                },
                {
                  icon: <Users className="h-4 w-4 text-purple-600" />,
                  title: "Referral analytics",
                  body: "ChatGPT-referred visitors arrive at conversion-ready intent. Track ChatGPT.com as a referral source in your analytics.",
                },
              ].map(({ icon, title, body }) => (
                <Card key={title} className="border-slate-200">
                  <CardContent className="pt-5 pb-5 space-y-2">
                    <div className="flex items-center gap-2">
                      {icon}
                      <span className="font-semibold text-sm">{title}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Common mistakes */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Common mistakes that hurt ChatGPT visibility</h2>
            <div className="space-y-3">
              {[
                { mistake: "Blocking OAI-SearchBot alongside GPTBot in a wildcard rule.", fix: "Use separate User-agent lines in robots.txt. Allow OAI-SearchBot, then decide on GPTBot separately." },
                { mistake: "Adding more content without fixing crawler access first.", fix: "No amount of content improvements matter if the bot can't read the page. Audit access before anything else." },
                { mistake: "Treating ChatGPT optimization as a one-time task.", fix: "Citation sources rotate frequently. Schedule a monthly audit and re-test your key prompts each time." },
                { mistake: "Expecting on-page changes to work without off-site entity signals.", fix: "If your brand isn't recognized, ChatGPT's retrieval step won't reach you. Build Wikipedia, press, and community presence alongside on-site work." },
              ].map(({ mistake, fix }) => (
                <Card key={mistake} className="border-rose-100 bg-rose-50/30">
                  <CardContent className="pt-4 pb-4 flex gap-3">
                    <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">{mistake}</p>
                      <p className="text-xs text-slate-600"><strong>Fix:</strong> {fix}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqJsonLd.mainEntity.map((q) => (
                <div key={q.name} className="border-b border-slate-100 pb-4 last:border-0">
                  <h3 className="font-semibold text-slate-900 text-sm mb-2">{q.name}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{q.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Related guides</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/what-is-answer-engine-optimization" className="text-emerald-600 hover:underline">What is Answer Engine Optimization (AEO)?</Link></li>
              <li><Link href="/how-to-appear-in-ai-search" className="text-emerald-600 hover:underline">How to appear in AI search results across all major engines</Link></li>
              <li><Link href="/best-aeo-tools" className="text-emerald-600 hover:underline">Best AEO tools in 2026</Link></li>
            </ul>
          </section>

          {/* CTA */}
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/30">
            <CardContent className="pt-7 pb-7 text-center space-y-3">
              <h2 className="font-bold text-xl text-slate-900">See exactly how ChatGPT sees your site</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Run a free AEO audit. You'll get your crawler access status, entity signals, schema gaps,
                and a prioritized fix list in under 60 seconds.
              </p>
              <Link href="/sign-up">
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-0 mt-2">
                  Audit my site, free <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
}
