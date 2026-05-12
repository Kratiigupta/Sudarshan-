-- =================================================================
-- 🛡️ SUDARSHAN ULTIMATE COMPREHENSIVE SCHEMA
-- Tables | Auth Triggers | Storage | RLS Policies | Functions
-- =================================================================

-- ============================================
-- 📊 1. TABLES SETUP
-- ============================================

-- PROFILES: Linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  digital_id text UNIQUE,
  avatar_url text,
  dob date,
  address text,
  role text DEFAULT 'tourist',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- USER SETTINGS: UI and App preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dark_mode boolean DEFAULT false,
  auto_translate boolean DEFAULT false,
  auto_sos boolean DEFAULT true,
  notifications boolean DEFAULT true,
  offline_maps boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id)
);

-- ITINERARIES: Travel plans
CREATE TABLE IF NOT EXISTS public.itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_people integer DEFAULT 1,
  hotel text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- BOOKINGS: Hotel or transport reservations
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_type text NOT NULL, -- 'hotel', 'flight', 'train'
  details jsonb DEFAULT '{}'::jsonb,
  booking_date timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- EMERGENCY CONTACTS: SOS targets
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  tracking boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- INCIDENTS: Reported safety issues
CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fir_id text UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL, -- 'theft', 'harassment', 'accident', etc.
  description text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  address text,
  severity text DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status text DEFAULT 'open', -- 'open', 'investigating', 'resolved'
  assigned_officer uuid,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- HOTSPOTS: Danger zones for map visualization
CREATE TABLE IF NOT EXISTS public.hotspots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude decimal(10, 8) NOT NULL,
  longitude decimal(11, 8) NOT NULL,
  radius_meters integer DEFAULT 500,
  type text NOT NULL,
  description text,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- ALERTS: Global/Local safety notifications
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL,
  severity text DEFAULT 'medium',
  area text,
  region text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  expires_at timestamp with time zone
);

-- ============================================
-- 🔐 2. AUTH & TRIGGERS
-- ============================================

-- Function to handle new user signup automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'name', 'New User'), new.email, 'tourist')
  ON CONFLICT (id) DO NOTHING;

  -- Insert into user_settings
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 📦 3. STORAGE SETUP
-- ============================================

-- Create 'avatars' bucket for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 🛡️ 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- CLEANUP OLD POLICIES (To avoid "already exists" errors)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- Profile Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Settings Policies
CREATE POLICY "Users can view own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Itinerary Policies
CREATE POLICY "Users can view own itinerary" ON public.itineraries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own itinerary" ON public.itineraries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own itinerary" ON public.itineraries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own itinerary" ON public.itineraries FOR DELETE USING (auth.uid() = user_id);

-- Booking Policies
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Emergency Contact Policies
CREATE POLICY "Users can view own emergency contacts" ON public.emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own emergency contacts" ON public.emergency_contacts FOR ALL USING (auth.uid() = user_id);

-- Incident Policies
CREATE POLICY "Users can view own incidents" ON public.incidents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can report an incident" ON public.incidents FOR INSERT WITH CHECK (true);

-- Public Data Policies (Anyone can see)
CREATE POLICY "Anyone can view hotspots" ON public.hotspots FOR SELECT USING (true);
CREATE POLICY "Anyone can view alerts" ON public.alerts FOR SELECT USING (true);

-- Storage Policies (Avatars)
-- Drop storage policies manually since they are in the 'storage' schema
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- ⚙️ 5. UTILITY FUNCTIONS & INDEXES
-- ============================================

-- Auto-update updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_itineraries_updated_at ON public.itineraries;
CREATE TRIGGER update_itineraries_updated_at BEFORE UPDATE ON public.itineraries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_incidents_updated_at ON public.incidents;
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_location ON public.incidents(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
