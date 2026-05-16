-- Add station column to incidents
ALTER TABLE public.incidents ADD COLUMN IF NOT EXISTS station text;

-- Update RLS to allow police to see incidents from their station (optional, but good for security)
-- For now, we'll keep it simple and just add the column.
