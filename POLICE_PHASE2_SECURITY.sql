-- =================================================================
-- 👮 POLICE PHASE 2: SECURITY & PERMISSIONS UPGRADE
-- =================================================================

-- 1. Helper function to check for police role
CREATE OR REPLACE FUNCTION public.is_police()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'police'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Incident Policies
-- Drop old policies first
DROP POLICY IF EXISTS "Police can view all incidents" ON public.incidents;
DROP POLICY IF EXISTS "Police can update incidents" ON public.incidents;

-- Create new ones
CREATE POLICY "Police can view all incidents" 
ON public.incidents FOR SELECT 
USING (auth.uid() = user_id OR is_police());

CREATE POLICY "Police can update incidents" 
ON public.incidents FOR UPDATE 
USING (is_police());

-- 3. Update Hotspot Policies
DROP POLICY IF EXISTS "Police can manage hotspots" ON public.hotspots;

CREATE POLICY "Police can manage hotspots" 
ON public.hotspots FOR ALL 
USING (is_police());

-- 4. Update Alert Policies
DROP POLICY IF EXISTS "Police can manage alerts" ON public.alerts;

CREATE POLICY "Police can manage alerts" 
ON public.alerts FOR ALL 
USING (is_police());

-- 5. Profile viewing for police (to see reporter details)
DROP POLICY IF EXISTS "Police can view all profiles" ON public.profiles;
CREATE POLICY "Police can view all profiles" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR is_police());
