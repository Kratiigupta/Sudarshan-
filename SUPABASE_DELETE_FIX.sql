-- =================================================================
-- 🛡️ SUDARSHAN SUPABASE DELETION FIX
-- Run this in the SQL Editor of your Supabase Dashboard
-- =================================================================

-- 1. Create a function to delete the auth user with SECURITY DEFINER
-- This bypasses RLS and allows regular users to trigger auth user deletion.
CREATE OR REPLACE FUNCTION public.handle_deleted_profile()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the AFTER DELETE trigger on the profiles table
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_profile();

-- 3. Add DELETE policy on public.profiles to allow users to delete their own profile
DROP POLICY IF EXISTS "Allow individual delete" ON public.profiles;
CREATE POLICY "Allow individual delete" ON public.profiles 
  FOR DELETE USING (auth.uid() = id);

-- 4. Add DELETE policy on public.user_settings
DROP POLICY IF EXISTS "Allow individual delete" ON public.user_settings;
CREATE POLICY "Allow individual delete" ON public.user_settings 
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Add DELETE policy on public.emergency_contacts
DROP POLICY IF EXISTS "Allow individual delete" ON public.emergency_contacts;
CREATE POLICY "Allow individual delete" ON public.emergency_contacts 
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Add DELETE policy on public.itineraries
DROP POLICY IF EXISTS "Allow individual delete" ON public.itineraries;
CREATE POLICY "Allow individual delete" ON public.itineraries 
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Add DELETE policy on public.bookings
DROP POLICY IF EXISTS "Allow individual delete" ON public.bookings;
CREATE POLICY "Allow individual delete" ON public.bookings 
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Add DELETE policy on public.incidents
DROP POLICY IF EXISTS "Allow individual delete" ON public.incidents;
CREATE POLICY "Allow individual delete" ON public.incidents 
  FOR DELETE USING (auth.uid() = user_id);

-- =================================================================
-- 🎉 DELETION FIX APPLIED successfully!
-- =================================================================
