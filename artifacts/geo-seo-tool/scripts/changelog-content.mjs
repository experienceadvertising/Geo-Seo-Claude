import { readFileSync } from "node:fs";
export const releases = JSON.parse(readFileSync(new URL("../src/data/releases.json", import.meta.url), "utf8"));
const url = "https://aeoimprovement.com/changelog";
export const changelogSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: releases.heading,
  description: releases.description,
  url,
  dateModified: releases.entries[0].isoDate,
  mainEntity: {
    "@type": "ItemList",
    numberOfItems: releases.entries.length,
    itemListElement: releases.entries.map((entry, i) => ({
      "@type": "ListItem", position: i + 1,
      name: entry.title, description: entry.summary, url: url + "#" + entry.slug,
    })),
  },
};
const escape = s => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
export function renderReleaseNotes() {
  return releases.entries.map(entry => `<article id="${escape(entry.slug)}"><p><time datetime="${entry.isoDate}">${entry.isoDate}</time> · ${entry.archive ? "Historical release" : escape(entry.badge)}</p><h2>${escape(entry.title)}</h2><p>${escape(entry.summary)}</p><p>For: ${escape(entry.audience)}</p><ul>${entry.items.map(item => `<li>${escape(item)}</li>`).join("")}</ul><nav aria-label="Try this update">${entry.links.map(link => `<a href="${escape(link.href)}">${escape(link.label)}</a>`).join(" · ")}</nav><a href="#${escape(entry.slug)}">Link to this update</a></article>`).join("\n");
}
