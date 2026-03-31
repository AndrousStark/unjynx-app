-- Migration 0007: Multi-tenant organizations
-- Creates organization tables, adds org_id to core tables, sets up RLS
-- Backwards compatible: all org_id columns are nullable

-- ── New Enums ────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE org_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer', 'guest');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE org_invite_status AS ENUM ('pending', 'accepted', 'declined', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE org_member_status AS ENUM ('active', 'invited', 'deactivated', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Organizations Table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  plan user_plan NOT NULL DEFAULT 'free',
  billing_email TEXT,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  logto_org_id TEXT UNIQUE,
  industry_mode TEXT,
  max_members INTEGER NOT NULL DEFAULT 5,
  max_projects INTEGER NOT NULL DEFAULT 3,
  max_storage_mb INTEGER NOT NULL DEFAULT 500,
  settings JSONB NOT NULL DEFAULT '{}',
  is_personal BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS organizations_plan_idx ON organizations(plan);
CREATE INDEX IF NOT EXISTS organizations_mode_idx ON organizations(industry_mode);

-- ── Organization Members ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  status org_member_status NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  preferences JSONB NOT NULL DEFAULT '{}',
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS org_memberships_user_id_idx ON org_memberships(user_id);

-- ── Organization Invites ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role org_role NOT NULL DEFAULT 'member',
  invite_code TEXT UNIQUE NOT NULL,
  invite_type TEXT NOT NULL DEFAULT 'email',
  invited_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  status org_invite_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS org_invites_org_id_idx ON org_invites(org_id);
CREATE INDEX IF NOT EXISTS org_invites_code_idx ON org_invites(invite_code);
CREATE INDEX IF NOT EXISTS org_invites_email_idx ON org_invites(email);

-- ── Organization Teams (sub-teams) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS org_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6C5CE7',
  lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS org_teams_org_id_idx ON org_teams(org_id);

-- ── Organization Team Members ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS org_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES org_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS org_team_members_org_id_idx ON org_team_members(org_id);

-- ── Add org_id to Existing Tables ────────────────────────────────────

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE projects ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE sections ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE comments ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_internal BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

ALTER TABLE tags ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE attachments ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ── New Indexes on org_id ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS tasks_org_id_idx ON tasks(org_id);
CREATE INDEX IF NOT EXISTS tasks_assignee_id_idx ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS tasks_parent_id_idx ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS tasks_org_status_idx ON tasks(org_id, status);
CREATE INDEX IF NOT EXISTS tasks_org_assignee_idx ON tasks(org_id, assignee_id);
CREATE INDEX IF NOT EXISTS projects_org_id_idx ON projects(org_id);
CREATE INDEX IF NOT EXISTS sections_org_id_idx ON sections(org_id);
CREATE INDEX IF NOT EXISTS comments_org_id_idx ON comments(org_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx ON comments(parent_id);
CREATE INDEX IF NOT EXISTS tags_org_id_idx ON tags(org_id);
CREATE INDEX IF NOT EXISTS attachments_org_id_idx ON attachments(org_id);

-- ── Organization Vocabulary Overrides ────────────────────────────────

CREATE TABLE IF NOT EXISTS org_vocabulary_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  original_term TEXT NOT NULL,
  custom_term TEXT NOT NULL,
  UNIQUE(org_id, original_term)
);

-- ── Auto-create Personal Orgs for Existing Users ─────────────────────
-- Each existing user gets a personal org with all their data assigned to it.

DO $$
DECLARE
  r RECORD;
  new_org_id UUID;
BEGIN
  FOR r IN SELECT id, email, name FROM profiles WHERE id NOT IN (
    SELECT DISTINCT owner_id FROM organizations WHERE is_personal = true
  )
  LOOP
    -- Create personal org
    INSERT INTO organizations (name, slug, owner_id, is_personal, plan, max_members, max_projects, max_storage_mb)
    VALUES (
      COALESCE(r.name, 'Personal') || '''s Workspace',
      'personal-' || REPLACE(r.id::text, '-', ''),
      r.id,
      true,
      'free',
      1,
      100,
      500
    )
    RETURNING id INTO new_org_id;

    -- Add user as owner member
    INSERT INTO org_memberships (org_id, user_id, role, status)
    VALUES (new_org_id, r.id, 'owner', 'active');

    -- Assign all their tasks to this org
    UPDATE tasks SET org_id = new_org_id WHERE user_id = r.id AND org_id IS NULL;

    -- Assign all their projects to this org
    UPDATE projects SET org_id = new_org_id WHERE user_id = r.id AND org_id IS NULL;

    -- Assign all their sections to this org
    UPDATE sections SET org_id = new_org_id WHERE user_id = r.id AND org_id IS NULL;

    -- Assign all their comments to this org
    UPDATE comments SET org_id = new_org_id WHERE user_id = r.id AND org_id IS NULL;

    -- Assign all their tags to this org
    UPDATE tags SET org_id = new_org_id WHERE user_id = r.id AND org_id IS NULL;

    -- Assign all their attachments to this org
    UPDATE attachments SET org_id = new_org_id WHERE user_id = r.id AND org_id IS NULL;

    RAISE NOTICE 'Created personal org % for user % (%)', new_org_id, r.id, r.email;
  END LOOP;
END $$;

-- ── RLS Policies ─────────────────────────────────────────────────────
-- Enable Row-Level Security on all org-scoped tables.
-- Policies filter by app.current_org_id (set via SET LOCAL in tenant middleware).
-- When app.current_org_id is not set, policies allow access to rows with NULL org_id
-- (backwards compatibility for personal workspace / non-org-scoped queries).

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'org_memberships', 'org_invites', 'org_teams', 'org_team_members',
      'org_vocabulary_overrides'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %s_org_isolation ON %I', tbl, tbl);
    EXECUTE format('
      CREATE POLICY %s_org_isolation ON %I
        USING (org_id = current_setting(''app.current_org_id'', true)::uuid)
        WITH CHECK (org_id = current_setting(''app.current_org_id'', true)::uuid)
    ', tbl, tbl);
  END LOOP;
END $$;

-- For tables that have nullable org_id (backwards compat), allow access when:
-- 1. org_id matches current_org_id, OR
-- 2. org_id IS NULL AND current_org_id is not set (personal workspace)
-- 3. No org context set at all (legacy queries)

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'tasks', 'projects', 'sections', 'comments', 'tags', 'attachments'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    -- Do NOT force RLS on these tables yet — allow non-RLS queries during transition
    -- EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
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
