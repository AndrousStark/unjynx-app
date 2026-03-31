-- Migration 0013: Report snapshots for analytics persistence

CREATE TABLE IF NOT EXISTS report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL,
  generated_by TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_snapshots_org_id_idx ON report_snapshots(org_id);
CREATE INDEX IF NOT EXISTS report_snapshots_type_idx ON report_snapshots(org_id, report_type);
CREATE INDEX IF NOT EXISTS report_snapshots_project_idx ON report_snapshots(project_id);
CREATE INDEX IF NOT EXISTS report_snapshots_period_idx ON report_snapshots(period_start, period_end);

ALTER TABLE report_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS report_snapshots_org_isolation ON report_snapshots;
CREATE POLICY report_snapshots_org_isolation ON report_snapshots
  USING (org_id = current_setting('app.current_org_id', true)::uuid
         OR current_setting('app.current_org_id', true) IS NULL
         OR current_setting('app.current_org_id', true) = '')
  WITH CHECK (org_id = current_setting('app.current_org_id', true)::uuid
         OR current_setting('app.current_org_id', true) IS NULL
         OR current_setting('app.current_org_id', true) = '');
