import { Link } from "wouter";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { SEO } from "@/components/seo";

export default function GoogleDataUsePage() {
  return (
    <main className="flex-1 bg-white text-slate-900">
      <SEO
        title="Google Data Use | AEO Improvement"
        description="How AEO Improvement accesses, uses, stores, and deletes Google Analytics and Search Console data."
        path="/google-data-use"
      />
      <article className="mx-auto max-w-3xl px-5 py-14 md:py-20">
        <div className="mb-8 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-emerald-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Google data use</h1>
            <p className="mt-1 text-sm text-slate-500">Effective September 2, 2026</p>
          </div>
        </div>

        <div className="prose prose-slate max-w-none">
          <p>
            AEO Improvement connects to Google Analytics 4 and Google Search Console only after you choose to connect a Google account. The connection is optional and is used to make your audit and reporting more useful.
          </p>

          <h2>Google permissions we request</h2>
          <ul>
            <li><code>analytics.readonly</code> to list the GA4 properties you can access and read reporting data.</li>
            <li><code>webmasters.readonly</code> to list verified Search Console properties and read search performance data.</li>
          </ul>
          <p>These are read-only permissions. AEO Improvement cannot edit your Google Analytics or Search Console properties.</p>

          <h2>How we use the data</h2>
          <ul>
            <li>Identify traffic referred by AI assistants and answer engines in your GA4 reporting.</li>
            <li>Show page and query performance from Search Console.</li>
            <li>Find pages and queries that may benefit from specific AEO improvements.</li>
            <li>Measure changes over time inside your account.</li>
          </ul>
          <p>We do not sell Google user data, use it for advertising, or use it to train general-purpose AI models.</p>

          <h2>Storage and access</h2>
          <p>
            Connection tokens are stored in AEO Improvement's server-side database and are not exposed to your browser. They are used only to refresh the connection and request the reporting data you asked AEO Improvement to display. Access is limited to the systems and service providers needed to operate and secure the integration.
          </p>

          <h2>Disconnecting and deleting data</h2>
          <p>
            You can disconnect Google Analytics or Search Console from the integrations area in your account. Disconnecting removes the saved connection from AEO Improvement and attempts to revoke the associated Google token. You can also revoke access from your Google Account permissions.
          </p>
          <p>
            To request deletion of your account and associated integration data, email <a href="mailto:hello@aeoimprovement.com">hello@aeoimprovement.com</a>.
          </p>

          <h2>Google API policy</h2>
          <p>
            AEO Improvement's use and transfer of information received from Google APIs follows the Google API Services User Data Policy, including its Limited Use requirements.
          </p>
          <p>
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1"
            >
              Google API Services User Data Policy <ExternalLink className="h-4 w-4" />
            </a>
          </p>

          <h2>Related policies</h2>
          <p><Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>.</p>
        </div>
      </article>
    </main>
  );
}
