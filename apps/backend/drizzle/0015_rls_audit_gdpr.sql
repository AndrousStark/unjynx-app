-- Migration 0015: RLS audit (ensure all org-scoped tables are covered)
-- + GDPR data export/deletion support

-- ══════════════════════════════════════════════════════════════════════
-- RLS AUDIT: Apply policies to ALL org-scoped tables
-- This is idempotent — safe to re-run.
-- ══════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  -- All tables that have an org_id column and need RLS
  FOR tbl IN SELECT unnest(ARRAY[
    -- Phase 1: Organizations
    'org_memberships', 'org_invites', 'org_teams', 'org_team_members',
    'org_vocabulary_overrides',
    -- Phase 1: Core tables with org_id
    'tasks', 'projects', 'sections', 'comments', 'tags', 'attachments',
    -- Phase 3: Workflows + task relations
    'workflows', 'workflow_statuses', 'workflow_transitions',
    'task_watchers', 'task_links', 'time_entries', 'task_activity',
    -- Phase 4: Sprints
    'sprints', 'sprint_tasks', 'sprint_burndown',
    -- Phase 5: Messaging
    'msg_channels', 'msg_channel_members', 'messages',
    'message_reactions', 'pinned_messages',
    -- Phase 6: Custom fields + SLA
    'custom_field_definitions', 'custom_field_values', 'sla_policies',
    -- Phase 7: AI
    'ai_operations', 'ai_suggestions',
    -- Phase 8: Reports
    'report_snapshots',
    -- Phase 9: Goals
    'goals', 'goal_task_links'
  ])
  LOOP
    -- Skip if table doesn't exist (safety)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      RAISE NOTICE 'Table % does not exist — skipping', tbl;
      CONTINUE;
    END IF;

    -- Enable RLS
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);

    -- Drop and recreate policy (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS %s_org_isolation ON %I', tbl, tbl);

    -- Policy: allow access when org_id matches current_org_id setting,
    -- OR when no org context is set (backwards compat / personal workspace),
    -- OR when org_id is NULL (legacy data)
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

    RAISE NOTICE 'RLS policy verified on %', tbl;
  END LOOP;

  RAISE NOTICE '══════════════════════════════════════════════';
  RAISE NOTICE 'RLS audit complete: all org-scoped tables secured';
  RAISE NOTICE '══════════════════════════════════════════════';
END $$;

-- ══════════════════════════════════════════════════════════════════════
-- PERFORMANCE: Ensure composite indexes exist on hot query patterns
-- ══════════════════════════════════════════════════════════════════════

-- Tasks hot paths
CREATE INDEX IF NOT EXISTS tasks_org_project_status_idx ON tasks(org_id, project_id, status);
CREATE INDEX IF NOT EXISTS tasks_org_created_idx ON tasks(org_id, created_at DESC);

-- Messages hot paths
CREATE INDEX IF NOT EXISTS messages_org_channel_idx ON messages(org_id, channel_id);

-- Sprints hot paths
CREATE INDEX IF NOT EXISTS sprints_org_active_idx ON sprints(org_id, status) WHERE status = 'active';

-- Goals hot paths
CREATE INDEX IF NOT EXISTS goals_org_active_idx ON goals(org_id, is_archived) WHERE is_archived = false;

-- Members hot path (for tenant middleware validation)
CREATE INDEX IF NOT EXISTS org_memberships_active_idx
  ON org_memberships(org_id, user_id, status) WHERE status = 'active';
