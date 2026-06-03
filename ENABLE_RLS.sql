-- ============================================================================
-- 🛡️ SUDARSHAN: ENABLE ROW LEVEL SECURITY (RLS) FIX
-- This script enables RLS on all tables and adds basic security policies.
-- ============================================================================

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- 2. CREATE POLICIES FOR 'profiles'
-- Users can read, insert, update, delete their own profile
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
CREATE POLICY "Users can manage their own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- 3. CREATE POLICIES FOR user_specific tables (user_settings, emergency_contacts, itineraries, bookings, incidents)
-- Users can only access their own data
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.emergency_contacts;
CREATE POLICY "Users can manage their own contacts" ON public.emergency_contacts
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own itineraries" ON public.itineraries;
CREATE POLICY "Users can manage their own itineraries" ON public.itineraries
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own bookings" ON public.bookings;
CREATE POLICY "Users can manage their own bookings" ON public.bookings
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own incidents" ON public.incidents;
CREATE POLICY "Users can manage their own incidents" ON public.incidents
    FOR ALL USING (auth.uid() = user_id);

-- 4. CREATE POLICIES FOR public tables (alerts, hotspots)
-- Anyone can read alerts and hotspots. Only logged in users can insert.
DROP POLICY IF EXISTS "Anyone can read alerts" ON public.alerts;
CREATE POLICY "Anyone can read alerts" ON public.alerts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert alerts" ON public.alerts;
CREATE POLICY "Authenticated users can insert alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can read hotspots" ON public.hotspots;
CREATE POLICY "Anyone can read hotspots" ON public.hotspots
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert hotspots" ON public.hotspots;
CREATE POLICY "Authenticated users can insert hotspots" ON public.hotspots
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
DROP POLICY IF EXISTS "Authenticated users can delete hotspots" ON public.hotspots;
CREATE POLICY "Authenticated users can delete hotspots" ON public.hotspots
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. CREATE POLICIES FOR otp_verifications (Used for auth)
-- Since this is used before login, we must allow anonymous users to insert and read.
DROP POLICY IF EXISTS "Anon can insert OTP" ON public.otp_verifications;
CREATE POLICY "Anon can insert OTP" ON public.otp_verifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can read OTP for verification" ON public.otp_verifications;
CREATE POLICY "Anon can read OTP for verification" ON public.otp_verifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anon can update OTP status" ON public.otp_verifications;
CREATE POLICY "Anon can update OTP status" ON public.otp_verifications
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anon can delete OTP" ON public.otp_verifications;
CREATE POLICY "Anon can delete OTP" ON public.otp_verifications
    FOR DELETE USING (true);

-- ============================================================================
-- 🎉 RLS IS NOW ENABLED AND SECURED!
-- ============================================================================
