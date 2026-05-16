-- Add station/department column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS station text;

-- Update handle_new_user to include station
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, name, email, role, station)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'New User'), 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'tourist'),
    new.raw_user_meta_data->>'station'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert into user_settings
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
