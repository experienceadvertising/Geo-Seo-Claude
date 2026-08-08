import { SEO } from "@/components/seo";

const sections = [
  {
    title: "Using the service",
    body: "You may use AEO Improvement only for lawful purposes and only for websites, prompts, accounts, and data you are authorized to analyze. You are responsible for the accuracy of account information and for keeping your login credentials secure.",
  },
  {
    title: "Audits and AI-generated outputs",
    body: "Scores, simulations, recommendations, and generated code are decision-support tools. AI answers are probabilistic and can change. AEO Improvement does not guarantee rankings, mentions, citations, traffic, revenue, or acceptance by any search engine or AI platform. Review generated code and recommendations before publishing them.",
  },
  {
    title: "Subscriptions and billing",
    body: "Paid plans are processed by Stripe. Monthly subscriptions renew until canceled. Annual plans are billed as a single payment and are generally non-refundable after purchase except where required by law. You can manage or cancel an active subscription through the Stripe customer portal. Access continues through the paid billing period unless the account is terminated for misuse.",
  },
  {
    title: "Free access and limits",
    body: "Free and promotional access may have usage, feature, or time limits. We may adjust reasonable limits to prevent abuse, manage third-party costs, and maintain product reliability. Material plan changes will be reflected on the pricing page.",
  },
  {
    title: "Acceptable use",
    body: "Do not use the service to break into systems, evade access controls, scrape prohibited content, upload malicious code, impersonate others, interfere with product operations, or violate third-party rights. Automated use must stay within documented limits.",
  },
  {
    title: "Your content",
    body: "You retain ownership of URLs, prompts, business information, and other content you submit. You grant AEO Improvement the limited permission needed to process that content and provide the requested service.",
  },
  {
    title: "Third-party services",
    body: "The product depends on third-party platforms, including hosting, payment, email, analytics, Google, and AI providers. Their availability, policies, and outputs may change. AEO Improvement is not responsible for third-party outages or decisions.",
  },
  {
    title: "Availability and changes",
    body: "We work to keep the service reliable, but uninterrupted availability is not guaranteed. We may improve, replace, suspend, or discontinue features. When practical, we will provide notice of material changes that affect paid use.",
  },
  {
    title: "Disclaimer and limitation",
    body: "The service is provided as available and without warranties that are not expressly stated here. To the maximum extent allowed by law, AEO Improvement is not liable for indirect, incidental, special, consequential, or lost-profit damages arising from use of the service.",
  },
  {
    title: "Termination",
    body: "You may stop using the service at any time. We may restrict or terminate accounts that violate these terms, create security risk, abuse third-party services, or fail to pay applicable charges.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-14 md:py-20">
      <SEO
        title="Terms of Service | AEO Improvement"
        description="Terms governing accounts, audits, subscriptions, AI-generated recommendations, and acceptable use of AEO Improvement."
        path="/terms"
      />
      <div className="space-y-3 border-b pb-8">
        <p className="text-sm font-semibold text-emerald-700">Effective August 8, 2026</p>
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">
          These terms apply when you create an account or use AEO Improvement.
        </p>
      </div>
      <div className="mt-10 space-y-9">
        {sections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Contact</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Questions about these terms can be sent to{" "}
            <a className="font-medium text-emerald-700 hover:underline" href="mailto:hello@aeoimprovement.com">
              hello@aeoimprovement.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
