-- Migration 0014: Goals / OKRs + goal-task links

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  parent_id UUID,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_value NUMERIC(10,2),
  current_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '%',
  level TEXT NOT NULL DEFAULT 'individual',
  status TEXT NOT NULL DEFAULT 'on_track',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS goals_org_id_idx ON goals(org_id);
CREATE INDEX IF NOT EXISTS goals_owner_id_idx ON goals(owner_id);
CREATE INDEX IF NOT EXISTS goals_parent_id_idx ON goals(parent_id);
CREATE INDEX IF NOT EXISTS goals_level_idx ON goals(org_id, level);
CREATE INDEX IF NOT EXISTS goals_status_idx ON goals(org_id, status);

CREATE TABLE IF NOT EXISTS goal_task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS goal_task_links_goal_id_idx ON goal_task_links(goal_id);
CREATE INDEX IF NOT EXISTS goal_task_links_task_id_idx ON goal_task_links(task_id);
CREATE INDEX IF NOT EXISTS goal_task_links_org_id_idx ON goal_task_links(org_id);

-- RLS
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['goals', 'goal_task_links'])
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
