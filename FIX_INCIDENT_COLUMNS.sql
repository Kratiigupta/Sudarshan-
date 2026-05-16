-- =================================================================
-- 🛠️ QUICK FIX: ADD MISSING COLUMNS FOR POLICE PANEL
-- =================================================================

-- Add missing columns to incidents table
ALTER TABLE public.incidents 
ADD COLUMN IF NOT EXISTS assigned_officer_name text,
ADD COLUMN IF NOT EXISTS reporter_name text;

-- Verify columns exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='assigned_officer_name') THEN
        ALTER TABLE public.incidents ADD COLUMN assigned_officer_name text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='incidents' AND column_name='reporter_name') THEN
        ALTER TABLE public.incidents ADD COLUMN reporter_name text;
    END IF;
END $$;
