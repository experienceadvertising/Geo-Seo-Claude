CREATE TABLE IF NOT EXISTS scheduled_job_items (
  id bigserial PRIMARY KEY,
  job text NOT NULL,
  slot text NOT NULL,
  subject_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  started_at timestamptz,
  finished_at timestamptz,
  delivery_outcomes jsonb,
  UNIQUE (job, slot, subject_id)
);
CREATE INDEX IF NOT EXISTS scheduled_job_items_pending ON scheduled_job_items (status, id);
