export interface WikiEntitySummary {
  title?: string;
  description?: string;
  extract?: string;
}

const NON_BUSINESS_ENTITY_RE =
  /\b(album|ep|single|mixtape|song|soundtrack|film|movie|television|tv[\s-]series|tv[\s-]show|sitcom|miniseries|documentary|novel|book|comic\s+book|manga|anime|magazine|newspaper|journal|publication|musician|singer|rapper|vocalist|band|actor|actress|athlete|politician|sportsperson|footballer|basketball\s+player|baseball\s+player|cricketer|painter|sculptor|visual\s+artist|poet|comedian|presenter|journalist|character|fictional)\b/i;

const BUSINESS_ENTITY_RE =
  /\b(company|business|corporation|organization|software|platform|service|website|application|app|technology|manufacturer|retailer|provider|startup|enterprise|brand|product)\b/i;

function normalizeEntityName(value: string): string {
  return value.toLowerCase().replace(/[\s,]+(?:inc\.?|llc\.?|ltd\.?|limited|corp\.?|corporation|company|co\.?)$/i, "").replace(/[^a-z0-9]/g, "");
}

export function isWikiArticleConfident(data: WikiEntitySummary, brand: string, domain: string): boolean {
  if (!data.extract) return false;
  const haystack = `${data.title || ""} ${data.description || ""} ${data.extract}`.toLowerCase();
  if (haystack.includes(domain.toLowerCase())) return true;
  if (data.description && NON_BUSINESS_ENTITY_RE.test(data.description)) return false;
  return normalizeEntityName(data.title || "") === normalizeEntityName(brand) && BUSINESS_ENTITY_RE.test(haystack);
}
