import React, { useState, useRef } from 'react';
import { Shield, User, Lock, Upload, ArrowRight, Building, CheckCircle2, Loader2, Fingerprint, AlertTriangle, Mail, Phone } from 'lucide-react';
import { authSignIn, authChangePassword, getCurrentUser, updateProfile, generateAndStoreOtp, verifyStoredOtp, registerNewUser } from '../supabase';
import { sendOtpViaEmail } from '../emailService';

const AuthPage = ({ onLogin }) => {
  const [view, setView] = useState('login'); 
  const [role, setRole] = useState('tourist'); 
  const [formData, setFormData] = useState({ 
    name: '', dob: '', address: '', email: '', phone: '', password: '', confirmPassword: '',
    adminCode: '', station: 'General Headquarters' 
  });
  const [fileName, setFileName] = useState('');
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  const [kycProgress, setKycProgress] = useState(0);
  
  const [generatedId, setGeneratedId] = useState('');
  const [registeredUserId, setRegisteredUserId] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1); 
    setOtp(newOtp);
    if (value !== '' && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  // ==========================================
  // 1. LOGIN LOGIC (SUPABASE)
  // ==========================================
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!formData.email || (!formData.email.includes('@') && !formData.email.startsWith('SU-'))) {
      setError("Please enter a valid email address or Digital ID.");
      setIsLoading(false);
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await authSignIn(formData.email, formData.password);
      
      if (authError) throw authError;

      if (data?.profile) {
        // Check if the selected role matches the user's role in database
        if (role !== data.profile.role) {
           setError(`❌ Access Denied: You are registered as a ${data.profile.role}, but trying to login as a ${role}.`);
           setIsLoading(false);
           return;
        }

        const userData = {
          name: data.profile.name || 'User',
          id: data.profile.digital_id || (data.profile.role === 'police' ? 'ADMIN-ID' : 'Pending'),
          phone: data.profile.phone || '',
          email: data.user.email,
          pin: formData.password, 
          avatar: data.profile.avatar_url || null,
          supabaseId: data.user.id,
          role: data.profile.role,
        };
        onLogin(userData, data.profile.role);
      } else {
        // Profile missing but auth succeeded - default to tourist if no role found
        const userData = {
          name: data.user.email.split('@')[0],
          id: 'Pending',
          phone: '',
          email: data.user.email,
          pin: formData.password,
          avatar: null,
          supabaseId: data.user.id,
        };
        onLogin(userData, 'tourist');
      }
    } catch (err) {
      setError(`❌ Login failed: ${err?.message || 'Invalid credentials.'}`);
    }
    setIsLoading(false);
  };

  // ==========================================
  // 2. REGISTRATION STEP 1: BASIC INFO
  // ==========================================
  const handleBasicInfoSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.dob || !formData.phone || !formData.address || !formData.email) {
      setError("Please fill all basic details."); return;
    }
    if (!formData.email.includes('@')) {
      setError("Please enter a valid email address."); return;
    }
    if (formData.phone.length < 10) {
      setError("Please enter a valid 10-digit mobile number."); return;
    }

    if (role === 'police') {
      if (formData.adminCode !== 'admin-2026') {
        setError("❌ INVALID ACCESS CODE: You must provide a valid Departmental Access Code to register as an Administrator.");
        return;
      }
    }

    setView('kyc');
  };

  // ==========================================
  // 3. REGISTRATION STEP 2: KYC UPLOAD & SEND OTP
  // ==========================================
  const handleKycUpload = async (e) => {
    e.preventDefault();
    if (!fileName) {
      setError("⚠️ KYC Document (Aadhaar/Passport) is MANDATORY."); return;
    }
    setError('');
    setIsUploadingKyc(true);

    // Simulate KYC processing animation
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      setKycProgress(prog);
      if (prog >= 100) clearInterval(interval);
    }, 200);

    // Step A: Generate & store OTP in Supabase DB
    const { otp, error: otpGenError } = await generateAndStoreOtp(formData.email);
    setIsUploadingKyc(false);

    if (otpGenError) {
      setError(`❌ Failed to generate OTP. Please check your internet connection and try again.`);
      return;
    }

    // Step B: Send OTP via EmailJS
    const { success, devMode } = await sendOtpViaEmail(
      formData.email,
      otp,
      formData.name,
      role
    );

    if (!success) {
      setError(`❌ Could not send OTP email. Please verify your email address and try again.`);
      return;
    }

    if (devMode) {
      // In dev mode, show OTP directly on screen for testing
      setError(`🛠️ DEV MODE — OTP not emailed. Check browser console for your OTP code.`);
    }

    setView('otp');
  };

  // ==========================================
  // 4. REGISTRATION STEP 3: OTP VERIFY
  // ==========================================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (otp.includes('')) {
      setError("Please enter the complete 6-digit OTP."); return;
    }
    
    setIsLoading(true);
    const token = otp.join('');

    // Verify against our Supabase otp_verifications table
    const { valid, error: verifyError } = await verifyStoredOtp(formData.email, token);
    setIsLoading(false);

    if (!valid) {
      setError(verifyError?.message || 'Invalid OTP. Please try again.');
    } else {
      setView('password');
    }
  };

  // ==========================================
  // 5. REGISTRATION STEP 4: PASSWORD & SUBMIT
  // ==========================================
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match."); return;
    }

    setView('generating');
    
    try {
      const isPolice = role === 'police';
      const newId = isPolice 
        ? 'POLICE-' + Math.floor(Math.random() * 9000 + 1000)
        : 'SU-' + Math.floor(Math.random() * 900000 + 100000);

      // ── Step 1: Create Supabase Auth account (email + password) ──────────
      // Our custom OTP already verified email ownership, so we register directly.
      const { data: authData, error: authError } = await registerNewUser(
        formData.email,
        formData.password
      );
      if (authError) throw authError;
      if (!authData?.user) throw new Error('Account creation failed. Please try again.');

      // ── Step 2: Save profile to DB ────────────────────────────────────────
      const { error: profileError } = await updateProfile(authData.user.id, {
        name:       formData.name,
        phone:      formData.phone,
        dob:        formData.dob || null,
        address:    formData.address || null,
        digital_id: newId,
        role:       role,
        station:    role === 'police' ? formData.station : null,
      });

      if (profileError) throw profileError;

      setGeneratedId(newId);
      setRegisteredUserId(authData.user.id);
      setTimeout(() => { setView('success'); }, 2000);

    } catch (err) {
      setError("❌ Registration Failed: " + (err?.message || 'Unknown error'));
      setView('password');
    }
  };



  const proceedToDashboard = () => {
    const userData = {
      name: formData.name,
      id: generatedId,
      phone: formData.phone,
      email: formData.email,
      pin: formData.password,
      dob: formData.dob, address: formData.address, avatar: null,
      role: role,
      supabaseId: registeredUserId,
      station: role === 'police' ? formData.station : null
    };
    onLogin(userData, role);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10 animate-fade-in">
        
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <Shield size={32} className="text-blue-300" />
          </div>
          <h1 className="text-3xl font-black tracking-widest">SUDARSHAN</h1>
          <p className="text-blue-200 text-sm mt-1">Smart Tourist Security Ecosystem</p>
        </div>

        <div className="p-8">
          
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 animate-fade-in">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-red-700">{error}</p>
            </div>
          )}

          {view === 'login' && (
             <form onSubmit={handleLoginSubmit} className="space-y-6 animate-fade-in">
             <div className="text-center mb-6">
               <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
               <p className="text-gray-500 text-sm">Please select your role to continue</p>
             </div>

             <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
               <button type="button" onClick={() => {setRole('tourist'); setError('');}} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${role === 'tourist' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                 <User size={16} /> Tourist
               </button>
               <button type="button" onClick={() => {setRole('police'); setError('');}} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${role === 'police' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                 <Building size={16} /> Administrator
               </button>
             </div>

             <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">{role === 'police' ? 'Administrator Email / ID' : 'Email Address'}</label>
               <div className="relative">
                 {role === 'police' ? <User className="absolute left-3 top-3 text-gray-400" size={20} /> : <Mail className="absolute left-3 top-3 text-gray-400" size={20} />}
                 <input type="text" onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:border-blue-500 outline-none font-medium" placeholder="Enter Email Address" />
               </div>
             </div>
             
             <div>
               <div className="flex justify-between items-end mb-2">
                 <label className="block text-sm font-bold text-gray-700">Password</label>
                 <button type="button" onClick={() => alert("Password reset email will be sent to your registered email.")} className="text-xs text-blue-600 font-bold hover:underline">Forgot Password?</button>
               </div>
               <div className="relative">
                 <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                 <input type="password" onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:border-blue-500 outline-none font-medium" placeholder="Enter Password" />
               </div>
             </div>

             <div className="flex gap-3">
               <button type="submit" disabled={isLoading} className={`flex-1 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex justify-center items-center gap-2 ${role === 'police' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-70`}>
                 {isLoading ? <Loader2 className="animate-spin" /> : <><Lock size={18}/> Login Securely</>}
               </button>
               <button type="button" onClick={() => alert("Biometric login coming soon...")} className="bg-gray-100 p-3.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-blue-600 transition flex items-center justify-center" title="Biometric Login">
                 <Fingerprint size={24} />
               </button>
             </div>
             
             <p className="text-center text-sm text-gray-600 font-medium mt-4">
                Need an account? <button type="button" onClick={() => {setView('register'); setError('');}} className="text-blue-600 font-bold hover:underline">Register Now</button>
              </p>
           </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleBasicInfoSubmit} className="space-y-4 animate-fade-in">
              <div className="text-center mb-4">
                <div className="flex justify-center gap-2 mb-4">
                  <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Step 1: Registration</h2>
                <p className="text-gray-500 text-sm">Select your role and enter basic details</p>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button type="button" onClick={() => {setRole('tourist'); setError('');}} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${role === 'tourist' ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                  <User size={16} /> Tourist
                </button>
                <button type="button" onClick={() => {setRole('police'); setError('');}} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${role === 'police' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Building size={16} /> Administrator
                </button>
              </div>

              <input type="text" placeholder={role === 'police' ? "Department Name / Full Name" : "Full Name (as per ID)"} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 outline-none font-medium" />
              
              {role === 'police' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="relative">
                    <Shield className="absolute left-3 top-3.5 text-blue-500" size={20} />
                    <input 
                      type="password" 
                      placeholder="Official Access Code" 
                      value={formData.adminCode} 
                      onChange={(e) => setFormData({...formData, adminCode: e.target.value})} 
                      className="w-full bg-blue-50 border-2 border-blue-200 rounded-xl p-3 pl-10 focus:border-blue-500 outline-none font-bold text-blue-900" 
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <input type="date" placeholder="Date of Birth" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="w-1/2 bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 outline-none font-bold text-gray-800" />
                <input type="tel" placeholder="Phone Number" maxLength="10" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} className="w-1/2 bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 outline-none font-medium" />
              </div>
              <input type="text" placeholder={role === 'police' ? "Department Address" : "Full Permanent Address"} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 outline-none font-medium" />
              <input type="email" placeholder={role === 'police' ? "Official Email Address" : "Email Address"} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 outline-none font-medium" />
              
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-4">
                Proceed to KYC <ArrowRight size={20} />
              </button>
              
              <p className="text-center text-sm text-gray-600 font-medium mt-4">
                Already registered? <button type="button" onClick={() => {setView('login'); setError('');}} className="text-blue-600 font-bold hover:underline">Login here</button>
              </p>
            </form>
          )}

          {view === 'kyc' && (
            <form onSubmit={handleKycUpload} className="space-y-4 animate-fade-in">
              <div className="text-center mb-4">
                <div className="flex justify-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                  <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Step 2: Verification</h2>
                <p className="text-gray-500 text-sm">{role === 'police' ? 'Upload Department ID or Official Proof' : 'Upload an ID for blockchain verification'}</p>
              </div>

              <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition relative overflow-hidden ${fileName ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                {isUploadingKyc && (
                  <div className="absolute inset-0 bg-blue-50/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <Fingerprint size={40} className="text-blue-600 animate-pulse mb-2" />
                    <div className="w-3/4 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{width: `${kycProgress}%`}}></div>
                    </div>
                    <p className="text-xs font-bold text-blue-800 mt-2">{role === 'police' ? 'Verifying Department Data...' : 'Verifying Aadhaar Data...'}</p>
                  </div>
                )}
                <input type="file" accept="image/*,.pdf" onChange={(e) => setFileName(e.target.files[0]?.name)} className="hidden" id="kyc-upload-original" disabled={isUploadingKyc} />
                <label htmlFor="kyc-upload-original" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                  {fileName ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-green-600 font-bold"><CheckCircle2 size={40} className="mb-2" /> {fileName}</div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
                      <div className="bg-blue-100 p-4 rounded-full mb-2"><Upload size={28} className="text-blue-600" /></div>
                      <span className="text-sm font-bold text-gray-800">{role === 'police' ? 'Upload Official ID / Badge' : 'Upload Aadhaar or Passport'} <span className="text-red-500">*</span></span>
                      <span className="text-[11px] font-medium opacity-70">JPG, PNG, or PDF up to 5MB</span>
                    </div>
                  )}
                </label>
              </div>

              <button type="submit" disabled={isUploadingKyc} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed">
                {isUploadingKyc ? 'Verifying...' : 'Submit & Request OTP'} <ArrowRight size={20} />
              </button>
            </form>
          )}

          {view === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-fade-in text-center">
              <div className="flex justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Step 3: Verify OTP</h2>

              {/* Email icon + address */}
              <div className="flex flex-col items-center gap-1">
                <div className="bg-blue-100 p-3 rounded-full"><Mail size={24} className="text-blue-600" /></div>
                <p className="text-gray-500 text-sm">6-digit code sent to</p>
                <p className="font-bold text-gray-800 text-sm">{formData.email}</p>
                <p className="text-[11px] text-gray-400 mt-1">⏱ OTP valid for 10 minutes &nbsp;|&nbsp; Check spam if not received</p>
              </div>

              {/* OTP inputs */}
              <div className="flex justify-center gap-2 my-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                    className="w-12 h-14 text-center text-2xl font-black border-2 border-gray-300 rounded-xl focus:border-blue-600 outline-none bg-gray-50 transition"
                  />
                ))}
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-700 transition flex justify-center gap-2 items-center disabled:opacity-70">
                {isLoading ? <><Loader2 size={20} className="animate-spin" /> Verifying...</> : <>Verify OTP <ArrowRight size={20}/></>}
              </button>

              {/* Resend OTP */}
              <p className="text-sm text-gray-500">
                Didn't receive it?{' '}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={async () => {
                    setError('');
                    const { otp: newOtp, error: genErr } = await generateAndStoreOtp(formData.email);
                    if (genErr) { setError('Failed to resend OTP. Try again.'); return; }
                    const { devMode } = await sendOtpViaEmail(formData.email, newOtp, formData.name, role);
                    if (devMode) setError('🛠️ DEV MODE — Check console for new OTP.');
                    else setError('✅ New OTP sent! Please check your inbox.');
                    setOtp(['', '', '', '', '', '']);
                    otpRefs[0].current?.focus();
                  }}
                  className="text-blue-600 font-bold hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </p>
            </form>
          )}

          {view === 'password' && (
            <form onSubmit={handleFinalSubmit} className="space-y-5 animate-fade-in text-center">
              <div className="flex justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Final Step: Security</h2>
              <p className="text-gray-500 text-sm mb-6">Set a strong PIN to secure your identity</p>

              <div className="relative">
                 <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                 <input type="password" placeholder="Create 6-digit PIN / Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 pl-10 focus:border-blue-500 outline-none font-medium" />
              </div>
              
              <div className="relative mt-4">
                 <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
                 <input type="password" placeholder="Confirm PIN" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 pl-10 focus:border-blue-500 outline-none font-medium" />
              </div>

              <button type="submit" className="w-full bg-green-600 text-white font-bold py-3.5 mt-6 rounded-xl shadow-lg hover:bg-green-700 transition flex justify-center gap-2 items-center">
                <CheckCircle2 size={20}/> Generate Digital ID
              </button>
            </form>
          )}

          {view === 'generating' && (
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className="text-2xl font-black text-gray-800">Generating Digital ID...</h2>
              <div className="space-y-3 text-sm font-bold text-gray-500">
                <p className="flex items-center justify-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> KYC Documents Verified</p>
                <p className="animate-pulse flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin text-blue-500" /> Creating Supabase Account...</p>
                <p className="animate-pulse flex items-center justify-center gap-2" style={{animationDelay: '1s'}}><Loader2 size={16} className="animate-spin text-indigo-500" /> Syncing with Secure Database...</p>
              </div>
            </div>
          )}

          {view === 'success' && (
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-800">ID Generated!</h2>
              
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-6 rounded-2xl relative">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">{role === 'police' ? 'Your Administrator ID' : 'Your Sudarshan Digital ID'}</p>
                <p className="text-3xl font-black text-blue-600 tracking-widest">{generatedId}</p>
              </div>
              
              <p className="text-sm text-gray-500 font-medium">Please note down this ID. You will use your <strong>email & password</strong> to login.</p>
              
              <button onClick={proceedToDashboard} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-green-700 transition flex justify-center items-center gap-2">
                Proceed to Dashboard <ArrowRight size={20} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;