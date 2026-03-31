-- Migration 0011: Custom fields + SLA policies

-- ── Custom Field Definitions ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL,
  description TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  default_value JSONB,
  options JSONB,
  applicable_task_types JSONB DEFAULT '["task","story","bug","epic"]',
  applicable_project_ids JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, field_key)
);

CREATE INDEX IF NOT EXISTS custom_field_defs_org_id_idx ON custom_field_definitions(org_id);

-- ── Custom Field Values ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, field_id)
);

CREATE INDEX IF NOT EXISTS custom_field_values_org_id_idx ON custom_field_values(org_id);
CREATE INDEX IF NOT EXISTS custom_field_values_task_id_idx ON custom_field_values(task_id);
CREATE INDEX IF NOT EXISTS custom_field_values_value_idx ON custom_field_values USING gin(value);

-- ── SLA Policies ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '{}',
  response_time_minutes INTEGER,
  resolution_time_minutes INTEGER,
  business_hours JSONB NOT NULL DEFAULT '{"mon":{"start":"09:00","end":"18:00"},"tue":{"start":"09:00","end":"18:00"},"wed":{"start":"09:00","end":"18:00"},"thu":{"start":"09:00","end":"18:00"},"fri":{"start":"09:00","end":"18:00"}}',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sla_policies_org_id_idx ON sla_policies(org_id);
CREATE INDEX IF NOT EXISTS sla_policies_project_id_idx ON sla_policies(project_id);

-- ── RLS ──────────────────────────────────────────────────────────────

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'custom_field_definitions', 'custom_field_values', 'sla_policies'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %s_org_isolation ON %I', tbl, tbl);
    EXECUTE format('
      CREATE POLICY %s_org_isolation ON %I
        USING (org_id = current_setting(''app.current_org_id'', true)::uuid
               OR current_setting(''app.current_org_id'', true) IS NULL
               OR current_setting(''app.current_org_id'', true) = '''')
        WITH CHECK (org_id = current_setting(''app.current_org_id'', true)::uuid
               OR current_setting(''app.current_org_id'', true) IS NULL
               OR current_setting(''app.current_org_id'', true) = '''')
    ', tbl, tbl);
  END LOOP;
END $$;
