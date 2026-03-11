-- NOM-024-SSA3-2012 / GIIS-A004-01-07 Audit Log Table
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

CREATE TABLE IF NOT EXISTS audit_logs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  timestamptz NOT NULL DEFAULT now(),
    user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    patient_id  text,               -- patient UUID (string, no FK since patients live in JSONB)
    action      text NOT NULL CHECK (action IN ('READ', 'WRITE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT')),
    metadata    jsonb DEFAULT '{}'  -- { module, fields[], format, timestamp, userAgent }
);

-- Index for fast lookups by patient and by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_patient  ON audit_logs (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user     ON audit_logs (user_id,    created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action   ON audit_logs (action,     created_at DESC);

-- Row Level Security: any authenticated user can INSERT (app writes logs)
-- Only admins (service_role) can SELECT all rows
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for authenticated users"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Admins can read all logs via service_role key (server-side only)
-- Front-end anon key cannot read audit_logs directly (intentional)
CREATE POLICY "Allow select for service role"
    ON audit_logs FOR SELECT
    TO service_role
    USING (true);
