-- ============================================================
-- Custom OTP Verifications Table
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS otp_verifications (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text        NOT NULL,
  otp_code    text        NOT NULL,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  used        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);

-- Enable Row Level Security (open policies for pre-auth OTP flow)
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "otp_insert_all"  ON otp_verifications;
DROP POLICY IF EXISTS "otp_select_all"  ON otp_verifications;
DROP POLICY IF EXISTS "otp_update_all"  ON otp_verifications;
DROP POLICY IF EXISTS "otp_delete_all"  ON otp_verifications;

CREATE POLICY "otp_insert_all"  ON otp_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "otp_select_all"  ON otp_verifications FOR SELECT USING (true);
CREATE POLICY "otp_update_all"  ON otp_verifications FOR UPDATE USING (true);
CREATE POLICY "otp_delete_all"  ON otp_verifications FOR DELETE USING (true);
