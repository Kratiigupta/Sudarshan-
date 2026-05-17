import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your_supabase');

if (!isConfigured) {
  console.warn('⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local');
}

// Use placeholder to prevent crash - all calls will fail gracefully
export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

export const isSupabaseConfigured = isConfigured;

// ============================================
// 🔐 Authentication
// ============================================

// ─── Custom 6-digit OTP (stored in otp_verifications table) ────────────────
// This is completely independent of Supabase Magic Link settings.

/** Generate a 6-digit OTP, persist it to DB (10 min expiry), and return the code. */
export const generateAndStoreOtp = async (email) => {
  try {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const normalizedEmail = email.trim().toLowerCase();

    // Remove any existing (unused) OTPs for this email first
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('email', normalizedEmail);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await supabase.from('otp_verifications').insert({
      email: normalizedEmail,
      otp_code: otpCode,
      expires_at: expiresAt,
      used: false,
    });

    if (error) throw error;
    return { otp: otpCode, error: null };
  } catch (error) {
    console.error('generateAndStoreOtp error:', error);
    return { otp: null, error };
  }
};

/** Verify the 6-digit OTP from DB. Marks it as used on success. */
export const verifyStoredOtp = async (email, inputCode) => {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('otp_code', inputCode.trim())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return { valid: false, error: new Error('Invalid or expired OTP. Please try again.') };
    }

    // Mark as used so it cannot be replayed
    await supabase
      .from('otp_verifications')
      .update({ used: true })
      .eq('id', data.id);

    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error };
  }
};

/**
 * Creates a new Supabase Auth account (email + password).
 * After our custom OTP has already verified email ownership,
 * we skip Supabase's own email confirmation by signing in immediately.
 */
export const registerNewUser = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // If Supabase returned a session → user is active immediately ✅
    if (data.session) return { data, error: null };

    // No session means Supabase wants email confirmation.
    // We've already verified email via our custom OTP, so sign in directly.
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // If sign-in fails (email not confirmed in Supabase settings),
      // return the user object so the profile can still be created.
      if (data.user) return { data: { user: data.user, session: null }, error: null };
      throw signInError;
    }

    return { data: signInData, error: null };
  } catch (error) {
    console.error('registerNewUser error:', error);
    return { data: null, error };
  }
};

export const authSignUp = async (email, password, userData) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    // Ensure session is active before inserting profile to pass RLS
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error('Please disable "Confirm email" in Supabase Auth Providers, or confirm your email first.');
        }
        throw signInError;
      }
    }

    // Store additional user data in profiles table
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          name: userData.name,
          email: email,
          phone: userData.phone,
          dob: userData.dob || null,
          address: userData.address || null,
          digital_id: userData.digitalId,
          role: userData.role || 'tourist',
          station: userData.station || null,
        });

      if (profileError) throw profileError;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const authSignIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Fetch user profile
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      return { data: { user: data.user, session: data.session, profile }, error: null };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const authSignOut = async () => {
  return await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;

    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      return { user: data.user, profile, error: null };
    }

    return { user: null, profile: null, error: null };
  } catch (error) {
    return { user: null, profile: null, error };
  }
};

export const authChangePassword = async (newPassword) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

// ============================================
// 👤 User Profiles
// ============================================

export const updateProfile = async (userId, profileData) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileData })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteUserProfile = async (userId) => {
  try {
    // Delete associated data from all user tables to avoid foreign key issues and clear data
    await supabase.from('user_settings').delete().eq('user_id', userId);
    await supabase.from('emergency_contacts').delete().eq('user_id', userId);
    await supabase.from('itineraries').delete().eq('user_id', userId);
    await supabase.from('bookings').delete().eq('user_id', userId);
    await supabase.from('incidents').delete().eq('user_id', userId);

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error("Error deleting user profile and data:", error);
    return { error };
  }
};

// ============================================
// 🗺️ Travel Itineraries
// ============================================

export const createItinerary = async (userId, itineraryData) => {
  try {
    const { data, error } = await supabase
      .from('itineraries')
      .insert([
        {
          user_id: userId,
          ...itineraryData,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getItinerary = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const upsertItinerary = async (userId, itineraryData) => {
  try {
    // Check if itinerary exists
    const { data: existing } = await supabase
      .from('itineraries')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('itineraries')
        .update(itineraryData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } else {
      return await createItinerary(userId, itineraryData);
    }
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================
// 🏨 Bookings & Reservations
// ============================================

export const createBooking = async (userId, bookingType, details) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([{ user_id: userId, booking_type: bookingType, details }])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getUserBookings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('booking_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================
// 📞 Emergency Contacts
// ============================================

export const addEmergencyContact = async (userId, contactData) => {
  try {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .insert([
        {
          user_id: userId,
          ...contactData,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getEmergencyContacts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

export const deleteEmergencyContact = async (contactId) => {
  try {
    const { error } = await supabase
      .from('emergency_contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ============================================
// 🚨 Incidents
// ============================================

export const createIncident = async (incidentData) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .insert([incidentData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getIncidents = async (limit = 10) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

export const getUserIncidents = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

export const updateIncident = async (incidentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('incidents')
      .update(updates)
      .eq('id', incidentId)
      .select();

    if (error) throw error;
    
    // If data is empty, it usually means RLS blocked the update or ID not found
    if (!data || data.length === 0) {
      throw new Error("Update failed: No rows affected. Check your RLS policies or user role.");
    }

    return { data: data[0], error: null };
  } catch (error) {
    console.error("Supabase Update Error:", error);
    return { data: null, error };
  }
};

// ============================================
// 🔔 Alerts
// ============================================

export const getAlerts = async (limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

export const createAlert = async (alertData) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .insert([alertData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================
// 🔥 Hotspots
// ============================================

export const getHotspots = async () => {
  try {
    const { data, error } = await supabase
      .from('hotspots')
      .select('*')
      .order('last_updated', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
};

export const createHotspot = async (hotspotData) => {
  try {
    const { data, error } = await supabase
      .from('hotspots')
      .insert([hotspotData])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const deleteHotspot = async (hotspotId) => {
  try {
    const { error } = await supabase
      .from('hotspots')
      .delete()
      .eq('id', hotspotId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// ============================================
// ⚙️ Settings
// ============================================

export const upsertSettings = async (userId, settingsData) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: userId, ...settingsData },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const getSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================
// 🔔 Real-time Subscriptions (Supabase v2)
// ============================================

export const subscribeToIncidents = (callback) => {
  return supabase
    .channel('incidents-realtime')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'incidents' },
      (payload) => callback(payload)
    )
    .subscribe();
};

export const subscribeToAlerts = (callback) => {
  return supabase
    .channel('alerts-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'alerts' },
      (payload) => callback(payload)
    )
    .subscribe();
};
