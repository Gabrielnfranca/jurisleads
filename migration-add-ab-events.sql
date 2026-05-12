-- Tabela para rastrear eventos do funil A/B
CREATE TABLE IF NOT EXISTS ab_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  session_id TEXT NOT NULL,
  variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  event_name TEXT NOT NULL,
  step INTEGER,
  ia_score TEXT,
  lead_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ab_events_slug_created_at
  ON ab_events(slug, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ab_events_slug_variant
  ON ab_events(slug, variant);

CREATE INDEX IF NOT EXISTS idx_ab_events_session
  ON ab_events(session_id);
