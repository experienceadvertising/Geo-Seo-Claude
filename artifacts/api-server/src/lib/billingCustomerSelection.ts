export type StripeCustomerCandidate = {
  id: string;
  metadataUserId: string | null;
  hasBlockingSubscription: boolean;
};

/**
 * Select a Stripe customer only when the match is unambiguous. An exact
 * metadata match wins. Otherwise, one active billing customer for the user's
 * verified email is safe to recover. We never guess between multiple active
 * customers.
 */
export function selectStripeCustomerCandidate(
  candidates: StripeCustomerCandidate[],
  userId: string,
  requireBlockingSubscription: boolean,
): string | null {
  const eligible = requireBlockingSubscription
    ? candidates.filter((candidate) => candidate.hasBlockingSubscription)
    : candidates;

  const exact = eligible.filter((candidate) => candidate.metadataUserId === userId);
  if (exact.length === 1) return exact[0].id;
  if (exact.length > 1) return null;

  const active = eligible.filter((candidate) => candidate.hasBlockingSubscription);
  if (active.length === 1) return active[0].id;
  if (active.length > 1) return null;

  return eligible.length === 1 ? eligible[0].id : null;
}
