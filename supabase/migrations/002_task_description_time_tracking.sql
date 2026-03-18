-- ============================================================
-- Migration 002: Task description, subtask status, time tracking
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add description column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Add status column to subtasks (replaces boolean done)
ALTER TABLE subtasks ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'todo'
  CHECK (status IN ('todo', 'in_progress', 'done'));

-- Migrate existing done=true rows to status='done'
UPDATE subtasks SET status = 'done' WHERE done = true;

-- 3. Create time_entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at      TIMESTAMPTZ,
  duration_seconds INTEGER,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Policy: users manage only their own entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'time_entries' AND policyname = 'users manage own time entries'
  ) THEN
    CREATE POLICY "users manage own time entries"
      ON time_entries
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
