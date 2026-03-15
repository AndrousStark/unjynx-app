-- =============================================================================
-- PostgreSQL Extensions for TODO Reminder App
-- =============================================================================
-- This runs automatically on first 'docker compose up'
-- =============================================================================

-- UUID generation (v7 for time-ordered IDs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Full-text search (already built-in, but ensure configs are loaded)
-- Used for searching TODOs, notes, tags

-- JSON path queries (PostgreSQL 16 has this built-in)
-- Used for querying jsonb metadata on tasks

-- Trigram matching for fuzzy search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create the Logto database (Logto needs its own database)
SELECT 'CREATE DATABASE logto'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'logto')\gexec
