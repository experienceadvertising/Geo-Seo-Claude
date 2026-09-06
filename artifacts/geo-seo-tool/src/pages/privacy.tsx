import { ExternalLink } from "lucide-react";
import { Link } from "wouter";
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
      "If you enable browser notifications, the browser provides a push endpoint and encryption keys that we store with your account so we can deliver the updates you requested.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "Provide audits, simulations, recommendations, monitoring, billing, support, and account communications.",
      "Protect accounts, prevent abuse, diagnose failures, and improve product reliability.",
      "Measure which marketing campaigns lead to signups and useful product activity when you grant analytics consent.",
      "Send audit-ready and next-task browser notifications only after you explicitly enable them on a supported browser. A notification may include a short recommendation title, but not page excerpts, audit scores, or search queries.",
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
      "Connecting Google is optional and happens only after you choose to authorize it. We request analytics.readonly to list the GA4 properties you can access and read reporting data, and webmasters.readonly to list verified Search Console properties and read search-performance data.",
      "We read GA4 property identifiers and names, report dates, session sources, and session counts to show traffic referred by AI assistants and answer engines. We read Search Console property URLs, search queries, page URLs, clicks, impressions, click-through rate, and average position to show SEO opportunities and observed performance inside your account.",
      "These permissions are read-only. AEO Improvement cannot edit your Google Analytics or Search Console properties, and it does not use Google user data for advertising or to train general-purpose AI models.",
      "OAuth access and refresh tokens are stored in AEO Improvement's server-side database and are not exposed to the browser. They are used only to maintain the connection and request the reporting data you ask the product to display. Access is limited to the systems and service providers needed to operate and secure the integration.",
      "We do not sell Google user data. We do not transfer it to unrelated third parties. We may disclose information when required by law or when necessary to protect users, the public, or the service.",
      "Our hosting and database providers process Google connection and reporting information to operate the integration. If you choose a Search Console query as a prompt-generation input, that query and the page context are sent to the AI service used for that requested feature. Google connection tokens are not sent to those AI services. Google data is not shared with advertising networks or data brokers.",
      "Google reporting requests use HTTPS. Requests for connected data require a signed-in account and are restricted to that account's connection. Connection credentials remain in the server-side database. No security measure can guarantee absolute protection.",
      "Disconnecting stops future access through the saved connection; it does not automatically delete audits, prompts, or other saved product records. Request deletion of those records by contacting evan@aeoimprovement.com. We retain product records as described below and do not promise immediate removal from backups or records subject to legal retention.",
      "Connection tokens are retained while the Google integration remains connected. Disconnecting Google from the product deletes the saved connection and its tokens from AEO Improvement and triggers a best-effort request to revoke the token with Google. You can also revoke access at any time from your Google Account permissions page.",
      "AEO Improvement's use and transfer of information received from Google APIs follows the Google API Services User Data Policy, including its Limited Use requirements.",
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
      "Turn browser notifications off from the browser where you enabled them. Expired or rejected browser endpoints are removed after the push provider reports that they no longer work.",
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
        <p className="text-sm font-semibold text-emerald-700">Updated September 6, 2026</p>
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
          <h2 className="text-xl font-semibold">More about Google data</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Read our <Link className="font-medium text-emerald-700 hover:underline" href="/google-data-use">Google Data Use page</Link> for a concise explanation of the Google permissions and product features. You can also review the{" "}
            <a
              className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:underline"
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noreferrer"
            >
              Google API Services User Data Policy <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>.
          </p>
        </section>
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
