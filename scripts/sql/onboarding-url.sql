-- Apply before deploying code that reads users.onboarding_url.
-- Additive only. Existing accounts continue with a null onboarding URL.
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_url text;
