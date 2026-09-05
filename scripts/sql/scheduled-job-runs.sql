-- Prepared only. Run once against the existing production database after approval.
-- No customer content, tokens, queries or email addresses are stored here.
CREATE TABLE IF NOT EXISTS scheduled_job_runs (
  job text NOT NULL,
  slot text NOT NULL,
  status text NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  PRIMARY KEY (job, slot)
);
