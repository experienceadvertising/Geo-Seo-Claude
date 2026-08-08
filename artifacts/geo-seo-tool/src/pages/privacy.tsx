import { SEO } from "@/components/seo";

const sections = [
  {
    title: "Information we collect",
    body: [
      "Account information such as your email address, optional first name, plan, and account status.",
      "Website URLs, audit inputs, prompt simulations, generated results, recommendation progress, monitored projects, and support messages you choose to provide.",
      "Billing status and transaction references provided by Stripe. AEO Improvement does not receive or store your full payment card number.",
      "Google account connection details and the read-only Analytics or Search Console data you ask the product to retrieve.",
      "Basic security, diagnostic, and product-usage information. Advertising and analytics identifiers are collected only after you accept analytics cookies.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "Provide audits, simulations, recommendations, monitoring, billing, support, and account communications.",
      "Protect accounts, prevent abuse, diagnose failures, and improve product reliability.",
      "Measure which marketing campaigns lead to signups and useful product activity when you grant analytics consent.",
      "Comply with legal obligations and enforce our Terms of Service.",
    ],
  },
  {
    title: "Service providers",
    body: [
      "We use service providers for hosting, payments, transactional email, analytics, advertising measurement, and AI-powered product functions. These may include Replit, Stripe, Postmark, Google, Meta, LinkedIn, OpenAI, Anthropic, Google Gemini, and Perplexity depending on the features you use and the consent you provide.",
      "We do not sell personal information. We do not allow advertising providers to load until you accept analytics and advertising tracking.",
    ],
  },
  {
    title: "Google user data",
    body: [
      "Google integrations use read-only permissions. AEO Improvement uses connected data only to show Analytics referral reporting and Search Console opportunities inside your account.",
      "You can disconnect Google from the Projects page. You may also revoke access from your Google Account permissions page.",
      "See our Google Data Use page for scopes, storage, deletion, and limited-use details.",
    ],
  },
  {
    title: "Retention and deletion",
    body: [
      "We retain account and product data for as long as needed to provide the service, meet legal obligations, resolve disputes, and protect the product.",
      "You can request account and personal-data deletion by emailing hello@aeoimprovement.com. We may retain limited records when required for fraud prevention, accounting, or other legal obligations.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "Choose Essential only in the cookie notice to prevent analytics and advertising tags from loading.",
      "Disconnect Google integrations from the product and manage third-party permissions from the relevant provider.",
      "Use unsubscribe links in marketing emails. Essential service, security, and billing messages may still be sent while your account remains active.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14 md:py-20">
      <SEO
        title="Privacy Policy | AEO Improvement"
        description="How AEO Improvement collects, uses, protects, and deletes account, audit, analytics, and Google integration data."
        path="/privacy"
      />
      <div className="space-y-3 border-b pb-8">
        <p className="text-sm font-semibold text-emerald-700">Effective August 8, 2026</p>
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">
          This policy explains what AEO Improvement collects and how that information is used.
        </p>
      </div>
      <div className="mt-10 space-y-9">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {section.body.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Questions or privacy requests can be sent to{" "}
            <a className="font-medium text-emerald-700 hover:underline" href="mailto:hello@aeoimprovement.com">
              hello@aeoimprovement.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
