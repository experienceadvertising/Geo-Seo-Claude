import { Link, useLocation } from "wouter";
import { ArrowRight, CheckCircle2, LineChart, Search, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEO, breadcrumbJsonLd } from "@/components/seo";

type Variant = "aeo" | "visibility" | "agency";

const PAGES: Record<Variant, {
  path: string;
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  audience: string;
  questions: Array<{ question: string; answer: string }>;
}> = {
  aeo: {
    path: "/aeo-software",
    title: "AEO Software for SEO Teams | AEO Improvement",
    description: "AEO software for teams that need to audit AI search visibility, identify SEO and GEO gaps, simulate buyer prompts, and turn findings into practical fixes.",
    eyebrow: "AEO software for practical teams",
    heading: "AEO software that tells you what to fix next",
    intro: "AEO Improvement connects technical SEO, content quality, and AI search visibility in one workflow. Start with an audit, see the evidence behind the highest-priority gaps, then use implementation-ready guidance to move the work forward.",
    audience: "Marketing and SEO teams that want an actionable starting point before they buy another dashboard.",
    questions: [
      { question: "What does AEO software do?", answer: "AEO software helps teams assess how clearly a website can be found, understood, and cited in AI-generated answers. A useful workflow checks technical access, factual content, structured data, brand signals, and real buyer questions." },
      { question: "Does AEO Improvement replace SEO software?", answer: "No. It is designed to connect SEO and AI-search work. Pro users can use Search Console opportunities and controlled keyword tracking alongside AI visibility checks, while Search Console remains the source of truth for organic performance." },
      { question: "Can I start without a credit card?", answer: "Yes. New accounts receive a 30-day guided trial with no card and no automatic charge. Pro activates connected Google data, rank tracking, and scheduled monitoring." },
    ],
  },
  visibility: {
    path: "/ai-visibility-software",
    title: "AI Visibility Software for SEO and GEO | AEO Improvement",
    description: "Use AI visibility software to audit crawler access, test buyer prompts across major AI engines, identify citation gaps, and guide SEO and GEO improvements.",
    eyebrow: "AI visibility software",
    heading: "Measure AI visibility, then improve the pages behind it",
    intro: "Visibility alone is not a plan. AEO Improvement helps you inspect the SEO, content, entity, schema, and crawler signals that shape how AI systems interpret a brand, then gives you a clear next action to take.",
    audience: "Teams that need a grounded way to connect AI-search questions with the website work they can actually control.",
    questions: [
      { question: "How do you measure AI visibility?", answer: "Use a consistent set of buyer questions, record whether a brand is mentioned or cited, and keep the supporting technical and content signals alongside the result. AI answers can vary, so changes should be presented as observed movement, not proof of causation." },
      { question: "Which AI engines can I test?", answer: "The guided trial includes ChatGPT, Claude, Gemini, and Perplexity. After the trial, Free and Starter include ChatGPT while Pro keeps all four engines and activates connected SEO tracking." },
      { question: "What can I fix after an AI visibility audit?", answer: "The workflow can surface crawler-access problems, unclear brand facts, missing or weak structured data, content-quality gaps, and technical SEO issues. Fix Generator output can draft schema and crawler-rule changes for review." },
    ],
  },
  agency: {
    path: "/geo-software-for-agencies",
    title: "GEO Software for Agencies | SEO and AI Visibility Client Workflow",
    description: "GEO software for agencies managing SEO and AI search visibility: audit client sites, simulate buyer prompts, prioritize improvements, and monitor client progress.",
    eyebrow: "GEO software for agencies",
    heading: "Give every client a practical SEO and GEO improvement plan",
    intro: "Agency work needs more than a visibility chart. AEO Improvement gives you a repeatable client workflow: audit the site, test buyer prompts, identify the evidence-backed next move, document completed work, and monitor progress over time.",
    audience: "Agencies that want to add GEO and AI-search visibility to their existing SEO service without making every client engagement a custom research project.",
    questions: [
      { question: "How many client sites can an agency manage?", answer: "The Agency plan supports up to 10 active client sites in Projects, plus 150 audits and 40 simulations per month. It includes two daily monitoring slots and weekly monitoring for the remaining active sites." },
      { question: "Can agencies use Google Search Console data?", answer: "Paid plans can connect Search Console for organic performance and opportunity analysis. The Agency plan currently supports one connected GA4 property per workspace while connection capacity is limited." },
      { question: "Does the tool prove a recommendation caused a ranking lift?", answer: "No. It records completed improvement actions and shows later rank or Search Console movement as observed outcomes. It does not claim that one change caused a result." },
    ],
  },
};

const STEPS = [
  { icon: Search, title: "Audit the evidence", body: "Review crawlability, technical SEO, content effort, brand facts, and structured data before guessing at a rewrite." },
  { icon: Sparkles, title: "Test meaningful prompts", body: "Use buyer-style questions to see how the major AI engines describe the category and whether your site is represented." },
  { icon: Wrench, title: "Ship the next fix", body: "Turn the most important gaps into specific work, including draft schema and crawler guidance where it applies." },
  { icon: LineChart, title: "Track the outcome", body: "Use Search Console and controlled rank snapshots alongside AI checks without treating correlation as causation." },
];

export default function SeoSolutionPage({ variant }: { variant: Variant }) {
  const page = PAGES[variant];
  const [, setLocation] = useLocation();
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "AEO Improvement",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `https://aeoimprovement.com${page.path}`,
    description: page.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", url: "https://aeoimprovement.com/sign-up" },
  };

  return (
    <div className="bg-white text-slate-900">
      <SEO title={page.title} description={page.description} path={page.path} jsonLd={[softwareJsonLd, faqJsonLd, breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: page.eyebrow, path: page.path }])]} />
      <section className="border-b bg-slate-950 text-white">
        <div className="mx-auto max-w-5xl px-5 py-16 md:py-20">
          <p className="text-sm font-semibold text-emerald-300">{page.eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">{page.heading}</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">{page.intro}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setLocation("/sign-up")}>Start the 30-day guided trial <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Link href="/pricing" className="text-sm font-medium text-white underline underline-offset-4 hover:text-emerald-200">See plans and limits</Link>
          </div>
          <p className="mt-3 text-xs text-slate-400">No card required. Nothing is charged automatically.</p>
        </div>
      </section>
      <main className="mx-auto max-w-5xl px-5 py-14 md:py-18">
        <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-slate-600">{page.audience}</p>
        <section className="mt-12 grid gap-4 md:grid-cols-2">
          {STEPS.map(({ icon: Icon, title, body }) => <Card key={title} className="border-slate-200"><CardContent className="p-6"><Icon className="h-5 w-5 text-emerald-600" /><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p></CardContent></Card>)}
        </section>
        <section className="mt-14 max-w-3xl">
          <h2 className="text-2xl font-bold">Questions teams ask before they start</h2>
          <div className="mt-6 space-y-5">
            {page.questions.map((item) => <div key={item.question} className="border-b border-slate-200 pb-5"><h3 className="font-semibold">{item.question}</h3><p className="mt-2 leading-relaxed text-slate-600">{item.answer}</p></div>)}
          </div>
        </section>
        <section className="mt-14 rounded-2xl border border-emerald-200 bg-emerald-50 p-7 text-center"><CheckCircle2 className="mx-auto h-6 w-6 text-emerald-600" /><h2 className="mt-3 text-xl font-bold">Start with the site you already have</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Run an audit before adding pages, rewriting copy, or buying more monitoring. You will have a concrete SEO and GEO work queue to review with your team.</p><Button className="mt-5 bg-emerald-600 hover:bg-emerald-700" onClick={() => setLocation("/sign-up")}>Audit my website <ArrowRight className="ml-2 h-4 w-4" /></Button></section>
      </main>
    </div>
  );
}
