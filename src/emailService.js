import emailjs from '@emailjs/browser';

// ── EmailJS Config ─────────────────────────────────────────
// Set these 3 values in your .env.local file:
//   VITE_EMAILJS_SERVICE_ID   = your emailjs service id
//   VITE_EMAILJS_TEMPLATE_ID  = your emailjs template id
//   VITE_EMAILJS_PUBLIC_KEY   = your emailjs public key
// ───────────────────────────────────────────────────────────
const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

const IS_CONFIGURED = SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY &&
  SERVICE_ID !== 'YOUR_SERVICE_ID';

/**
 * Sends a 6-digit OTP to the given email via EmailJS.
 * In DEV mode (not configured), logs OTP to console for testing.
 */
export const sendOtpViaEmail = async (toEmail, otpCode, userName = 'User', role = 'tourist') => {
  if (!IS_CONFIGURED) {
    // ── DEV FALLBACK: show OTP in console so you can test without EmailJS ──
    console.warn('══════════════════════════════════════════');
    console.warn('📧 EmailJS NOT configured — DEV MODE OTP:');
    console.warn(`   Email : ${toEmail}`);
    console.warn(`   OTP   : ${otpCode}`);
    console.warn('══════════════════════════════════════════');
    return { success: true, error: null, devMode: true };
  }

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email       : toEmail,
        user_name      : userName,
        otp_code       : otpCode,
        user_role      : role === 'police' ? 'Administrator' : 'Tourist',
        expiry_minutes : '10',
        app_name       : 'Sudarshan Safety System',
      },
      PUBLIC_KEY
    );
    return { success: true, error: null, devMode: false };
  } catch (err) {
    console.error('EmailJS send error:', err);
    return { success: false, error: err, devMode: false };
  }
};
