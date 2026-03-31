-- Migration 0012: AI operations audit log + suggestions

CREATE TABLE IF NOT EXISTS ai_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  operation_type TEXT NOT NULL,
  input_context JSONB NOT NULL,
  output JSONB,
  model_used TEXT,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  accepted_by_user BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_operations_org_id_idx ON ai_operations(org_id);
CREATE INDEX IF NOT EXISTS ai_operations_user_id_idx ON ai_operations(user_id);
CREATE INDEX IF NOT EXISTS ai_operations_type_idx ON ai_operations(operation_type);
CREATE INDEX IF NOT EXISTS ai_operations_created_at_idx ON ai_operations(created_at);

CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL,
  suggestion JSONB NOT NULL,
  confidence NUMERIC(3,2),
  accepted BOOLEAN,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_suggestions_org_id_idx ON ai_suggestions(org_id);
CREATE INDEX IF NOT EXISTS ai_suggestions_entity_idx ON ai_suggestions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ai_suggestions_type_idx ON ai_suggestions(suggestion_type);

-- RLS
DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['ai_operations', 'ai_suggestions'])
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
