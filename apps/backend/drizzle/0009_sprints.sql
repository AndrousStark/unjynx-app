-- Migration 0009: Sprint / Cycle management tables

-- sprint_status enum already created in 0008

-- ── Sprints ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  status sprint_status NOT NULL DEFAULT 'planning',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  committed_points INTEGER NOT NULL DEFAULT 0,
  completed_points INTEGER NOT NULL DEFAULT 0,
  retro_went_well TEXT,
  retro_to_improve TEXT,
  retro_action_items JSONB DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sprints_org_id_idx ON sprints(org_id);
CREATE INDEX IF NOT EXISTS sprints_project_id_idx ON sprints(project_id);
CREATE INDEX IF NOT EXISTS sprints_status_idx ON sprints(status);
CREATE INDEX IF NOT EXISTS sprints_org_project_status_idx ON sprints(org_id, project_id, status);

-- ── Sprint Tasks ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sprint_tasks (
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  removed_at TIMESTAMPTZ,
  PRIMARY KEY (sprint_id, task_id)
);

CREATE INDEX IF NOT EXISTS sprint_tasks_org_id_idx ON sprint_tasks(org_id);
CREATE INDEX IF NOT EXISTS sprint_tasks_task_id_idx ON sprint_tasks(task_id);

-- ── Sprint Burndown ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sprint_burndown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  captured_at DATE NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  completed_points INTEGER NOT NULL DEFAULT 0,
  remaining_points INTEGER NOT NULL DEFAULT 0,
  added_points INTEGER NOT NULL DEFAULT 0,
  removed_points INTEGER NOT NULL DEFAULT 0,
  UNIQUE(sprint_id, captured_at)
);

CREATE INDEX IF NOT EXISTS sprint_burndown_org_id_idx ON sprint_burndown(org_id);
CREATE INDEX IF NOT EXISTS sprint_burndown_sprint_id_idx ON sprint_burndown(sprint_id);

-- ── RLS ──────────────────────────────────────────────────────────────

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['sprints', 'sprint_tasks', 'sprint_burndown'])
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
