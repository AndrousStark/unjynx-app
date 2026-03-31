-- Migration 0008: Jira-like project management
-- Adds workflows, issue types, task relations, time tracking

-- ── New Enums ────────────────────────────────────────────────────────

DO $$ BEGIN CREATE TYPE project_type AS ENUM ('kanban', 'scrum', 'bug_tracker', 'service_desk'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE task_type AS ENUM ('epic', 'story', 'task', 'bug', 'subtask', 'improvement'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE issue_link_type AS ENUM ('blocks', 'is_blocked_by', 'relates_to', 'duplicates', 'is_duplicated_by'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE status_category AS ENUM ('todo', 'in_progress', 'done'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE sprint_status AS ENUM ('planning', 'active', 'completed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Extend Projects ──────────────────────────────────────────────────

ALTER TABLE projects ADD COLUMN IF NOT EXISTS key TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_type project_type NOT NULL DEFAULT 'kanban';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS default_assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workflow_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS issue_counter INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS projects_lead_id_idx ON projects(lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS projects_org_key_idx ON projects(org_id, key);

-- ── Workflows ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS workflows_org_id_idx ON workflows(org_id);

CREATE TABLE IF NOT EXISTS workflow_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category status_category NOT NULL DEFAULT 'todo',
  color TEXT DEFAULT '#6C5CE7',
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_initial BOOLEAN NOT NULL DEFAULT false,
  is_final BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(workflow_id, name)
);
CREATE INDEX IF NOT EXISTS workflow_statuses_workflow_id_idx ON workflow_statuses(workflow_id);

CREATE TABLE IF NOT EXISTS workflow_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  from_status_id UUID NOT NULL REFERENCES workflow_statuses(id) ON DELETE CASCADE,
  to_status_id UUID NOT NULL REFERENCES workflow_statuses(id) ON DELETE CASCADE,
  name TEXT,
  allowed_roles JSONB DEFAULT '["owner","admin","manager","member"]',
  conditions JSONB DEFAULT '{}',
  on_transition JSONB DEFAULT '{}',
  UNIQUE(workflow_id, from_status_id, to_status_id)
);
CREATE INDEX IF NOT EXISTS workflow_transitions_workflow_id_idx ON workflow_transitions(workflow_id);

-- ── Extend Tasks (Jira-like) ─────────────────────────────────────────

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS issue_key TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_type task_type NOT NULL DEFAULT 'task';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS epic_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sprint_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimate_points INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimate_hours NUMERIC(8,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS logged_hours NUMERIC(8,2) NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS remaining_hours NUMERIC(8,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS vote_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS watcher_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS comment_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS tasks_reporter_id_idx ON tasks(reporter_id);
CREATE INDEX IF NOT EXISTS tasks_epic_id_idx ON tasks(epic_id);
CREATE INDEX IF NOT EXISTS tasks_sprint_id_idx ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS tasks_status_id_idx ON tasks(status_id);
CREATE INDEX IF NOT EXISTS tasks_task_type_idx ON tasks(task_type);
CREATE INDEX IF NOT EXISTS tasks_org_sprint_idx ON tasks(org_id, sprint_id);
CREATE INDEX IF NOT EXISTS tasks_org_type_idx ON tasks(org_id, task_type);
CREATE INDEX IF NOT EXISTS tasks_org_due_idx ON tasks(org_id, due_date);
CREATE UNIQUE INDEX IF NOT EXISTS tasks_org_issue_key_idx ON tasks(org_id, issue_key);

-- ── Task Watchers ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_watchers (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, user_id)
);
CREATE INDEX IF NOT EXISTS task_watchers_org_id_idx ON task_watchers(org_id);

-- ── Task Links ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  source_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  target_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  link_type issue_link_type NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_task_id, target_task_id, link_type)
);
CREATE INDEX IF NOT EXISTS task_links_org_id_idx ON task_links(org_id);
CREATE INDEX IF NOT EXISTS task_links_source_idx ON task_links(source_task_id);
CREATE INDEX IF NOT EXISTS task_links_target_idx ON task_links(target_task_id);

-- ── Time Entries ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  hours NUMERIC(8,2) NOT NULL,
  description TEXT,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS time_entries_org_id_idx ON time_entries(org_id);
CREATE INDEX IF NOT EXISTS time_entries_task_id_idx ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS time_entries_user_id_idx ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS time_entries_date_idx ON time_entries(logged_date);

-- ── Task Activity Log ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS task_activity_org_id_idx ON task_activity(org_id);
CREATE INDEX IF NOT EXISTS task_activity_task_id_idx ON task_activity(task_id);
CREATE INDEX IF NOT EXISTS task_activity_created_at_idx ON task_activity(created_at);

-- ── Seed Default Workflows ───────────────────────────────────────────
-- System workflows (org_id = NULL, is_system = true) available to all orgs

DO $$
DECLARE
  wf_simple UUID;
  wf_standard UUID;
  wf_bug UUID;
  s_todo UUID; s_prog UUID; s_review UUID; s_done UUID;
  s_new UUID; s_triaged UUID; s_fixing UUID; s_fixed UUID; s_verified UUID; s_closed UUID;
BEGIN
  -- Skip if already seeded
  IF EXISTS (SELECT 1 FROM workflows WHERE is_system = true LIMIT 1) THEN
    RAISE NOTICE 'System workflows already exist — skipping';
    RETURN;
  END IF;

  -- 1. Simple workflow: Todo → Done
  INSERT INTO workflows (name, description, is_default, is_system)
  VALUES ('Simple', 'Two-state workflow: Todo and Done', true, true)
  RETURNING id INTO wf_simple;

  INSERT INTO workflow_statuses (workflow_id, name, category, color, sort_order, is_initial, is_final)
  VALUES
    (wf_simple, 'Todo', 'todo', '#6B7280', 0, true, false),
    (wf_simple, 'Done', 'done', '#10B981', 1, false, true);

  SELECT id INTO s_todo FROM workflow_statuses WHERE workflow_id = wf_simple AND name = 'Todo';
  SELECT id INTO s_done FROM workflow_statuses WHERE workflow_id = wf_simple AND name = 'Done';

  INSERT INTO workflow_transitions (workflow_id, from_status_id, to_status_id, name) VALUES
    (wf_simple, s_todo, s_done, 'Complete'),
    (wf_simple, s_done, s_todo, 'Reopen');

  -- 2. Standard workflow: Todo → In Progress → In Review → Done
  INSERT INTO workflows (name, description, is_system)
  VALUES ('Standard', 'Four-state workflow with review step', true)
  RETURNING id INTO wf_standard;

  INSERT INTO workflow_statuses (workflow_id, name, category, color, sort_order, is_initial, is_final) VALUES
    (wf_standard, 'Todo', 'todo', '#6B7280', 0, true, false),
    (wf_standard, 'In Progress', 'in_progress', '#3B82F6', 1, false, false),
    (wf_standard, 'In Review', 'in_progress', '#F59E0B', 2, false, false),
    (wf_standard, 'Done', 'done', '#10B981', 3, false, true);

  SELECT id INTO s_todo FROM workflow_statuses WHERE workflow_id = wf_standard AND name = 'Todo';
  SELECT id INTO s_prog FROM workflow_statuses WHERE workflow_id = wf_standard AND name = 'In Progress';
  SELECT id INTO s_review FROM workflow_statuses WHERE workflow_id = wf_standard AND name = 'In Review';
  SELECT id INTO s_done FROM workflow_statuses WHERE workflow_id = wf_standard AND name = 'Done';

  INSERT INTO workflow_transitions (workflow_id, from_status_id, to_status_id, name) VALUES
    (wf_standard, s_todo, s_prog, 'Start'),
    (wf_standard, s_prog, s_review, 'Submit for Review'),
    (wf_standard, s_review, s_done, 'Approve'),
    (wf_standard, s_review, s_prog, 'Request Changes'),
    (wf_standard, s_done, s_todo, 'Reopen');

  -- 3. Bug workflow: New → Triaged → In Progress → Fixed → Verified → Closed
  INSERT INTO workflows (name, description, is_system)
  VALUES ('Bug Tracker', 'Six-state workflow for bug tracking', true)
  RETURNING id INTO wf_bug;

  INSERT INTO workflow_statuses (workflow_id, name, category, color, sort_order, is_initial, is_final) VALUES
    (wf_bug, 'New', 'todo', '#6B7280', 0, true, false),
    (wf_bug, 'Triaged', 'todo', '#8B5CF6', 1, false, false),
    (wf_bug, 'In Progress', 'in_progress', '#3B82F6', 2, false, false),
    (wf_bug, 'Fixed', 'in_progress', '#F59E0B', 3, false, false),
    (wf_bug, 'Verified', 'done', '#10B981', 4, false, false),
    (wf_bug, 'Closed', 'done', '#059669', 5, false, true);

  SELECT id INTO s_new FROM workflow_statuses WHERE workflow_id = wf_bug AND name = 'New';
  SELECT id INTO s_triaged FROM workflow_statuses WHERE workflow_id = wf_bug AND name = 'Triaged';
  SELECT id INTO s_prog FROM workflow_statuses WHERE workflow_id = wf_bug AND name = 'In Progress';
  SELECT id INTO s_fixed FROM workflow_statuses WHERE workflow_id = wf_bug AND name = 'Fixed';
  SELECT id INTO s_verified FROM workflow_statuses WHERE workflow_id = wf_bug AND name = 'Verified';
  SELECT id INTO s_closed FROM workflow_statuses WHERE workflow_id = wf_bug AND name = 'Closed';

  INSERT INTO workflow_transitions (workflow_id, from_status_id, to_status_id, name) VALUES
    (wf_bug, s_new, s_triaged, 'Triage'),
    (wf_bug, s_triaged, s_prog, 'Start Work'),
    (wf_bug, s_prog, s_fixed, 'Mark Fixed'),
    (wf_bug, s_fixed, s_verified, 'Verify Fix'),
    (wf_bug, s_fixed, s_prog, 'Reopen (fix failed)'),
    (wf_bug, s_verified, s_closed, 'Close'),
    (wf_bug, s_closed, s_new, 'Reopen');

  RAISE NOTICE 'Seeded 3 system workflows with statuses and transitions';
END $$;

-- ── RLS on New Tables ────────────────────────────────────────────────

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'workflows', 'workflow_statuses', 'workflow_transitions',
    'task_watchers', 'task_links', 'time_entries', 'task_activity'
  ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %s_org_isolation ON %I', tbl, tbl);
    EXECUTE format('
      CREATE POLICY %s_org_isolation ON %I
        USING (
          CASE
            WHEN current_setting(''app.current_org_id'', true) IS NULL
              OR current_setting(''app.current_org_id'', true) = ''''
            THEN true
            ELSE org_id = current_setting(''app.current_org_id'', true)::uuid
              OR org_id IS NULL
          END
        )
        WITH CHECK (
          CASE
            WHEN current_setting(''app.current_org_id'', true) IS NULL
              OR current_setting(''app.current_org_id'', true) = ''''
            THEN true
            ELSE org_id = current_setting(''app.current_org_id'', true)::uuid
              OR org_id IS NULL
          END
        )
    ', tbl, tbl);
  END LOOP;
END $$;
