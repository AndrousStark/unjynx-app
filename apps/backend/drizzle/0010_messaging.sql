-- Migration 0010: Slack-like messaging channels

-- ── Messaging Channels ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS msg_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'public',
  topic TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES profiles(id),
  dm_user_ids JSONB,
  member_count INTEGER NOT NULL DEFAULT 0,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS msg_channels_org_id_idx ON msg_channels(org_id);
CREATE INDEX IF NOT EXISTS msg_channels_type_idx ON msg_channels(org_id, channel_type);
CREATE UNIQUE INDEX IF NOT EXISTS msg_channels_org_name_idx ON msg_channels(org_id, name);

-- ── Channel Members ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS msg_channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES msg_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_muted BOOLEAN NOT NULL DEFAULT false,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_message_id UUID,
  notification_pref TEXT NOT NULL DEFAULT 'all',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS msg_channel_members_org_id_idx ON msg_channel_members(org_id);
CREATE INDEX IF NOT EXISTS msg_channel_members_user_id_idx ON msg_channel_members(user_id);

-- ── Messages ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES msg_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  thread_id UUID,
  is_thread_root BOOLEAN NOT NULL DEFAULT false,
  reply_count INTEGER NOT NULL DEFAULT 0,
  mentioned_user_ids JSONB DEFAULT '[]',
  mentioned_team_ids JSONB DEFAULT '[]',
  is_channel_mention BOOLEAN NOT NULL DEFAULT false,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_org_id_idx ON messages(org_id);
CREATE INDEX IF NOT EXISTS messages_channel_created_idx ON messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS messages_thread_id_idx ON messages(thread_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS messages_mentions_idx ON messages USING gin(mentioned_user_ids);
CREATE INDEX IF NOT EXISTS messages_fts_idx ON messages USING gin(
  to_tsvector('english', coalesce(content, ''))
);

-- ── Message Reactions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS message_reactions_message_idx ON message_reactions(message_id);

-- ── Pinned Messages ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES msg_channels(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL REFERENCES profiles(id),
  pinned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(channel_id, message_id)
);

CREATE INDEX IF NOT EXISTS pinned_messages_channel_idx ON pinned_messages(channel_id);

-- ── RLS ──────────────────────────────────────────────────────────────

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'msg_channels', 'msg_channel_members', 'messages',
    'message_reactions', 'pinned_messages'
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
