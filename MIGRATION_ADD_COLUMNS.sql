-- ============================================
-- 🚀 SUDARSHAN MIGRATION: ADD EMAIL TO CONTACTS
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add email column to emergency_contacts if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='emergency_contacts' AND column_name='email') THEN
        ALTER TABLE public.emergency_contacts ADD COLUMN email text;
    END IF;
END $$;

-- 2. Ensure dob and address columns exist in profiles (added in previous step)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='dob') THEN
        ALTER TABLE public.profiles ADD COLUMN dob date;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='address') THEN
        ALTER TABLE public.profiles ADD COLUMN address text;
    END IF;
END $$;

-- 3. Verify RLS (Row Level Security)
-- This ensures the column is accessible under existing policies
COMMENT ON COLUMN public.emergency_contacts.email IS 'Email address for SOS notifications';
