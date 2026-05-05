// Named-author byline used for Article schema across guide-style pages.
// Per the 2026 practitioner consensus baked into our own recommendation
// engine, AI search engines weight pages with a named Person author
// significantly higher than Organization-only authors for citation.

export const PRIMARY_AUTHOR = {
  name: "Evan Weber",
  jobTitle: "Founder, AEO Improvement",
  url: "https://www.linkedin.com/in/worldsgreatestmarketer/",
  sameAs: ["https://www.linkedin.com/in/worldsgreatestmarketer/"],
} as const;

export const PUBLISHER_ORG = {
  "@type": "Organization" as const,
  name: "AEO Improvement",
  url: "https://aeoimprovement.com/",
  logo: {
    "@type": "ImageObject" as const,
    url: "https://aeoimprovement.com/favicon.svg",
  },
};

export const AUTHOR_PERSON_LD = {
  "@type": "Person" as const,
  name: PRIMARY_AUTHOR.name,
  jobTitle: PRIMARY_AUTHOR.jobTitle,
  url: PRIMARY_AUTHOR.url,
  sameAs: PRIMARY_AUTHOR.sameAs,
  worksFor: PUBLISHER_ORG,
};
