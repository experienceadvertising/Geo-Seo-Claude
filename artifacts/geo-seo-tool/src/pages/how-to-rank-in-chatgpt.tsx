import { Link } from "wouter";
import { CheckCircle2, ArrowRight, Bot, Globe, FileCode, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEO, breadcrumbJsonLd } from "@/components/seo";
import { AUTHOR_PERSON_LD, PRIMARY_AUTHOR, PUBLISHER_ORG } from "@/data/author";
import { GuideSources } from "@/components/guide-sources";

const PAGE_TITLE = "How to Rank in ChatGPT: Get Your Site Cited in AI Answers (2026)";
const PAGE_DESC =
  "A practical guide to ChatGPT search visibility. Check OAI-SearchBot access, improve useful page content, and measure sampled mentions and citations.";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does ChatGPT decide which websites to cite?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenAI documents OAI-SearchBot for search, GPTBot for model training, and ChatGPT-User for some user requests. Search access and useful page content matter, but OpenAI does not publish a formula that guarantees a citation.",
      },
    },
    {
      "@type": "Question",
      name: "Does blocking GPTBot stop ChatGPT from citing my site?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GPTBot and OAI-SearchBot have separate roles and robots.txt controls. Blocking GPTBot does not by itself block OAI-SearchBot. Check OpenAI's current crawler documentation and your actual access rules before deciding.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to start appearing in ChatGPT answers?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "There is no reliable timeline or guaranteed citation result. Check access after a change, then sample relevant questions over time and compare referral traffic and conversions.",
      },
    },
    {
      "@type": "Question",
      name: "What structured data matters most for ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "OpenAI does not document a special schema requirement for ChatGPT citations. Use accurate structured data when it describes visible page content and follow the relevant search provider's policies.",
      },
    },
    {
      "@type": "Question",
      name: "Can small or newer sites rank in ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, newer sites can be discovered. Publish useful, accessible answers with clear company facts and genuine evidence. Relevant independent coverage can help people find and evaluate the brand, but a Wikipedia page or special markup is not a prerequisite.",
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
  dateModified: "2026-09-19",
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
        modifiedTime="2026-09-19"
        authorName={PRIMARY_AUTHOR.name}
        jsonLd={[articleJsonLd, faqJsonLd, breadcrumb]}
      />
      <div className="min-h-[calc(100vh-4rem)] py-10 px-4 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Hero */}
          <header className="space-y-4">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 border px-3 py-1 text-xs font-semibold inline-flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5" /> ChatGPT Search Optimization · Updated September 2026
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              How to rank in ChatGPT: get your site cited in AI answers
            </h1>
            <p className="text-sm text-slate-500">
              By <a href={PRIMARY_AUTHOR.url} rel="author" className="text-emerald-700 hover:underline font-medium">{PRIMARY_AUTHOR.name}</a>, {PRIMARY_AUTHOR.jobTitle} · Updated September 19, 2026
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              ChatGPT search can show links to web pages, but no site can guarantee selection.
              This guide covers the access checks, useful content, and measurement that a site
              owner can actually control.
            </p>
          </header>

          {/* TL;DR */}
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="pt-6 pb-6 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Key takeaway</div>
              <p className="text-slate-800 leading-relaxed text-sm">
                Check OAI-SearchBot access for search, make the answer easy for readers to find,
                and test real buyer questions. Keep GPTBot training access as a separate decision.
                An eligible page may still be absent from a particular response.
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
              OpenAI documents separate crawlers for search, model training, and some user requests.
              Knowing which role you are controlling makes a robots.txt decision more useful.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="border-slate-200">
                <CardContent className="pt-5 pb-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-sky-600" />
                    <span className="font-semibold text-sm">OAI-SearchBot</span>
                    <Badge variant="outline" className="text-[10px] px-1.5">Search</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    OpenAI identifies this bot for ChatGPT search. Allowing access can make a page
                    eligible for search discovery, but does not guarantee that an answer will cite it.
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
                    Collects data for model training. It has a separate robots.txt control from
                    OAI-SearchBot, so site owners can choose a different policy for search and training.
                  </p>
                </CardContent>
              </Card>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Check your robots.txt and CDN policy for OAI-SearchBot, then test whether the page can be
              fetched. Access is a prerequisite for this crawler, not proof that a citation will follow.
            </p>
          </section>

          {/* The 6 factors */}
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-slate-900">What you can check and improve</h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              OpenAI does not publish a citation formula. These checks help you make the page
              accessible and useful, then measure actual results.
            </p>
            <ul className="space-y-3">
              <Bullet>
                <strong>Crawler access.</strong> OAI-SearchBot must be explicitly allowed or not blocked.
                Check <code className="bg-slate-100 px-1 rounded text-xs">yourdomain.com/robots.txt</code> and
                search for OAI-SearchBot.
              </Bullet>
              <Bullet>
                <strong>Content access.</strong> Check whether the main answer and links are available
                to a crawler. Inspect both initial HTML and rendered content before changing architecture.
              </Bullet>
              <Bullet>
                <strong>Clear answers.</strong> Put the answer near the relevant heading and include
                enough context to help a person act. There is no required sentence count.
              </Bullet>
              <Bullet>
                <strong>Brand facts.</strong> Explain who you are, what you offer, and how to verify
                your claims. Genuine independent coverage can add context, but no profile is required.
              </Bullet>
              <Bullet>
                <strong>Structured data.</strong> Use accurate markup where it describes visible content.
                OpenAI does not document a special ChatGPT schema requirement.
              </Bullet>
              <Bullet>
                <strong>Current information.</strong> Update facts when they change and use truthful
                publication dates. A changed date alone does not make an old page useful.
              </Bullet>
            </ul>
          </section>

          {/* Step-by-step */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Step-by-step: what to fix and in what order</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Start with access and the reader's question. Then add evidence and measure the result.
            </p>
            <div className="space-y-6">
              <Step number={1} title="Audit your robots.txt">
                <p>
                  Open <code className="bg-slate-100 px-1 rounded text-xs">yourdomain.com/robots.txt</code> in a browser.
                  Search the page for "OAI-SearchBot", "GPTBot", and any wildcard <code className="bg-slate-100 px-1 rounded text-xs">User-agent: *</code> rules
                  that might be blocking all bots.
                </p>
                <p>
                  Decide deliberately which search and training access fits your site. OAI-SearchBot
                  and GPTBot have separate controls. Confirm your rules against OpenAI's current docs.
                </p>
              </Step>
              <Step number={2} title="Check that your content is crawlable">
                <p>
                  In your browser, right-click your most important page and choose View Page Source
                  (not Inspect Element). Search for your main value proposition or a key sentence from
                  the page.
                </p>
                <p>
                  If it is missing, inspect the rendered page and test actual crawler access. A
                  JavaScript page is not automatically invisible, and a framework change needs evidence.
                </p>
              </Step>
              <Step number={3} title="Answer a real buyer question">
                <p>
                  Choose a page tied to a customer question. Put the answer near the top and include
                  the facts, limitations, and next step someone needs. Add FAQPage markup only when
                  it accurately describes visible content and meets feature policies.
                </p>
                <p>
                  Check the published page and any structured data against provider policies.
                </p>
              </Step>
              <Step number={4} title="Verify your company facts">
                <p>
                  Keep your company name, offer, contact path, and genuine profiles consistent.
                  Organization JSON-LD can describe those facts when it matches the visible page.
                </p>
              </Step>
              <Step number={5} title="Restructure content for direct-answer extraction">
                <p>
                  For each major section of content on your key pages, check whether the opening
                  paragraph immediately answers the heading as a question. Rewrite sections that build
                  context before the answer. Lead with the answer, then explain.
                </p>
              </Step>
              <Step number={6} title="Share original, checkable information">
                <p>
                  Publish original data or practical examples with a clear method and limits. Share
                  them with relevant communities or publications when they will help those readers.
                </p>
                <p>
                  Independent mentions can help people find and assess your brand. They are not a
                  guaranteed route into an AI answer.
                </p>
              </Step>
            </div>
          </section>

          {/* What to measure */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900">How to measure your ChatGPT citation rate</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              AI answers can vary by prompt, date, and retrieval context. Record those details and
              repeat your most important buyer questions. One answer is a sample, not a stable rate.
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
                  body: "Track ChatGPT referral visits and the actions those visitors take. Use your own data to judge quality.",
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
                { mistake: "Treating one AI answer as a permanent result.", fix: "Retest important buyer questions and record prompt, date, model, and cited URL." },
                { mistake: "Adding unsupported brand claims.", fix: "Use accurate company facts and real examples that a reader can check." },
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

          <GuideSources />

          {/* CTA */}
          <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/30">
            <CardContent className="pt-7 pb-7 text-center space-y-3">
              <h2 className="font-bold text-xl text-slate-900">Check your site and sample ChatGPT answers</h2>
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
