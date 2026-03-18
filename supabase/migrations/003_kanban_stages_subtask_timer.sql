-- ============================================================
-- Migration 003: Kanban stages + subtask timer support
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add subtask_id to time_entries (for subtask-level timers)
ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS subtask_id UUID REFERENCES subtasks(id) ON DELETE CASCADE;

-- 2. Create kanban_stages table (custom workflow columns per user)
CREATE TABLE IF NOT EXISTS kanban_stages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL,
  position     INT  NOT NULL DEFAULT 0,
  color        TEXT NOT NULL DEFAULT '#64748b',
  is_terminal  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, slug)
);

ALTER TABLE kanban_stages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'kanban_stages' AND policyname = 'users manage own stages'
  ) THEN
    CREATE POLICY "users manage own stages"
      ON kanban_stages FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
