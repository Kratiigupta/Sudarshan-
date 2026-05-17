import React, { useState, useRef } from 'react';
import { Shield, User, Lock, Upload, ArrowRight, Building, CheckCircle2, Loader2, Fingerprint, AlertTriangle, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { authSignIn, authChangePassword, getCurrentUser, updateProfile, generateAndStoreOtp, verifyStoredOtp, registerNewUser } from '../supabase';
import { sendOtpViaEmail } from '../emailService';

const AuthPage = ({ onLogin, isDark }) => {
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
  const [showPassword, setShowPassword] = useState(false);

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
        localStorage.setItem('sudarshan_bio_email', formData.email);
        localStorage.setItem('sudarshan_bio_pass', btoa(formData.password));
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
        localStorage.setItem('sudarshan_bio_email', formData.email);
        localStorage.setItem('sudarshan_bio_pass', btoa(formData.password));
        onLogin(userData, 'tourist');
      }
    } catch (err) {
      setError(`❌ Login failed: ${err?.message || 'Invalid credentials.'}`);
    }
    setIsLoading(false);
  };

  const handleBiometricLogin = async () => {
    const savedEmail = localStorage.getItem('sudarshan_bio_email');
    const savedPass = localStorage.getItem('sudarshan_bio_pass');

    if (!savedEmail || !savedPass) {
      setError("No Digital ID linked. Please login with your password once to enable Biometrics.");
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      if (window.PublicKeyCredential) {
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Trigger OS-level Biometric / FaceID / TouchID Prompt
        await navigator.credentials.create({
          publicKey: {
            challenge: challenge,
            rp: { name: "Sudarshan Digital ID" },
            user: { id: new Uint8Array(16), name: savedEmail, displayName: "Verified Tourist" },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            authenticatorSelection: { userVerification: "required" },
            timeout: 60000
          }
        });

        // Biometric passed, automatically authenticate with Supabase
        const { data, error: authError } = await authSignIn(savedEmail, atob(savedPass));
        if (authError) throw authError;
        
        if (data?.profile) {
          const userData = {
            name: data.profile.name || 'User',
            id: data.profile.digital_id || (data.profile.role === 'police' ? 'ADMIN-ID' : 'Pending'),
            phone: data.profile.phone || '',
            email: data.user.email,
            pin: atob(savedPass), 
            avatar: data.profile.avatar_url || null,
            supabaseId: data.user.id,
            role: data.profile.role,
          };
          onLogin(userData, data.profile.role);
        } else {
          onLogin({ name: data.user.email.split('@')[0], id: 'Pending', email: data.user.email, supabaseId: data.user.id }, 'tourist');
        }

      } else {
        setError("Biometric hardware is not supported on this browser/device.");
      }
    } catch (err) {
      console.error(err);
      setError("Biometric verification canceled or failed.");
    } finally {
      setIsLoading(false);
    }
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

    if (otpGenError) {
      setIsUploadingKyc(false);
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

    setIsUploadingKyc(false);
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
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        
        {/* Left Side - Branding */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white p-12 flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 text-center space-y-6">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 flex items-center justify-center mx-auto shadow-2xl">
              <Shield size={48} className="text-blue-300" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-widest mb-2">SUDARSHAN</h1>
              <p className="text-blue-200 font-medium tracking-wide">Smart Tourist Security Ecosystem</p>
            </div>
          </div>
        </div>

        {/* Right Side - Forms */}
        <div className="w-full md:w-7/12 p-8 md:p-12 lg:p-16 relative">
          
          {error && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${error.includes('DEV MODE') ? (isDark ? 'bg-orange-900/30 border-orange-700 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-800') : (isDark ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-600')}`}>
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <p className="text-sm font-bold">{error}</p>
            </div>
          )}

          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6 animate-fade-in">
              <div className="mb-8">
                <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Welcome Back</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Access your secure dashboard</p>
              </div>

              <div className={`flex p-1 rounded-xl mb-6 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <button type="button" onClick={() => {setRole('tourist'); setError('');}} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${role === 'tourist' ? (isDark ? 'bg-slate-600 text-blue-400 shadow' : 'bg-white text-blue-600 shadow') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700')}`}>
                  <User size={16} /> Tourist
                </button>
                <button type="button" onClick={() => {setRole('police'); setError('');}} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${role === 'police' ? (isDark ? 'bg-slate-600 text-indigo-400 shadow' : 'bg-white text-indigo-600 shadow') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700')}`}>
                  <Building size={16} /> Administrator
                </button>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{role === 'police' ? 'Administrator Email / ID' : 'Email Address'}</label>
                <div className="relative">
                  {role === 'police' ? <User className={`absolute left-3 top-3 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} size={20} /> : <Mail className={`absolute left-3 top-3 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} size={20} />}
                  <input type="text" onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full border-2 rounded-xl py-3 pl-10 pr-4 focus:border-blue-500 outline-none font-medium transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`} placeholder="Enter Email Address" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className={`block text-sm font-bold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Password</label>
                  <button type="button" onClick={() => alert("Password reset email will be sent to your registered email.")} className={`text-xs font-bold hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Forgot Password?</button>
                </div>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} size={20} />
                  <input type={showPassword ? "text" : "password"} onChange={(e) => setFormData({...formData, password: e.target.value})} className={`w-full border-2 rounded-xl py-3 pl-10 pr-12 focus:border-blue-500 outline-none font-medium transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`} placeholder="Enter Password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-3 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={isLoading} className={`flex-1 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex justify-center items-center gap-2 ${role === 'police' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-70`}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <><Lock size={18}/> Login Securely</>}
                </button>
                <button type="button" onClick={handleBiometricLogin} disabled={isLoading} className={`p-3.5 rounded-xl border transition flex items-center justify-center ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-blue-400' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:text-blue-600'} disabled:opacity-50`} title="Biometric Login">
                  <Fingerprint size={24} />
                </button>
              </div>
              
              <p className={`text-center text-sm font-medium mt-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Need an account? <button type="button" onClick={() => {setView('register'); setError('');}} className={`font-bold hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Register Now</button>
              </p>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleBasicInfoSubmit} className="space-y-4 animate-fade-in">
              <div className="text-center mb-4">
                <div className="flex justify-center gap-2 mb-4">
                  <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                </div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Step 1: Registration</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Select your role and enter basic details</p>
              </div>

              <div className={`flex p-1 rounded-xl mb-6 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                <button type="button" onClick={() => {setRole('tourist'); setError('');}} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${role === 'tourist' ? (isDark ? 'bg-slate-600 text-blue-400 shadow' : 'bg-white text-blue-600 shadow') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700')}`}>
                  <User size={16} /> Tourist
                </button>
                <button type="button" onClick={() => {setRole('police'); setError('');}} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition ${role === 'police' ? (isDark ? 'bg-slate-600 text-indigo-400 shadow' : 'bg-white text-indigo-600 shadow') : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700')}`}>
                  <Building size={16} /> Administrator
                </button>
              </div>

              <input type="text" placeholder={role === 'police' ? "Department Name / Full Name" : "Full Name (as per ID)"} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
              
              {role === 'police' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="relative">
                    <Shield className="absolute left-3 top-3.5 text-blue-500" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Official Access Code" 
                      value={formData.adminCode} 
                      onChange={(e) => setFormData({...formData, adminCode: e.target.value})} 
                      className={`w-full border-2 rounded-xl p-3 pl-10 pr-12 focus:border-blue-500 outline-none font-bold transition-colors ${isDark ? 'bg-blue-900/30 border-blue-800 text-blue-300 placeholder-blue-500' : 'bg-blue-50 border-blue-200 text-blue-900'}`} 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-3.5 ${isDark ? 'text-blue-400 hover:text-blue-200' : 'text-blue-500 hover:text-blue-700'}`}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <input type="date" placeholder="Date of Birth" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className={`w-1/2 border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-bold transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`} />
                <input type="tel" placeholder="Phone Number" maxLength="10" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} className={`w-1/2 border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200'}`} />
              </div>
              <input type="text" placeholder={role === 'police' ? "Department Address" : "Full Permanent Address"} value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200'}`} />
              <input type="email" placeholder={role === 'police' ? "Official Email Address" : "Email Address"} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={`w-full border-2 rounded-xl p-3 focus:border-blue-500 outline-none font-medium transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200'}`} />
              
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-700 transition flex justify-center items-center gap-2 mt-4">
                Proceed to KYC <ArrowRight size={20} />
              </button>
              
              <p className={`text-center text-sm font-medium mt-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Already registered? <button type="button" onClick={() => {setView('login'); setError('');}} className={`font-bold hover:underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Login here</button>
              </p>
            </form>
          )}

          {view === 'kyc' && (
            <form onSubmit={handleKycUpload} className="space-y-4 animate-fade-in">
              <div className="text-center mb-4">
                <div className="flex justify-center gap-2 mb-4">
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                  <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                </div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Step 2: Verification</h2>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{role === 'police' ? 'Upload Department ID or Official Proof' : 'Upload an ID for blockchain verification'}</p>
              </div>

              <div className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition relative overflow-hidden ${fileName ? (isDark ? 'border-green-500 bg-green-900/20' : 'border-green-400 bg-green-50') : (isDark ? 'border-slate-600 bg-slate-700/50 hover:bg-slate-700' : 'border-gray-300 bg-gray-50 hover:bg-gray-100')}`}>
                {isUploadingKyc && (
                  <div className={`absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center z-10 ${isDark ? 'bg-slate-800/90' : 'bg-blue-50/90'}`}>
                    <Fingerprint size={40} className="text-blue-500 animate-pulse mb-2" />
                    <div className={`w-3/4 rounded-full h-2.5 overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{width: `${kycProgress}%`}}></div>
                    </div>
                    <p className={`text-xs font-bold mt-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>{role === 'police' ? 'Verifying Department Data...' : 'Verifying Aadhaar Data...'}</p>
                  </div>
                )}
                <input type="file" accept="image/*,.pdf" onChange={(e) => setFileName(e.target.files[0]?.name)} className="hidden" id="kyc-upload-original" disabled={isUploadingKyc} />
                <label htmlFor="kyc-upload-original" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                  {fileName ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-green-500 font-bold"><CheckCircle2 size={40} className="mb-2" /> {fileName}</div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center gap-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      <div className={`p-4 rounded-full mb-2 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}><Upload size={28} className="text-blue-500" /></div>
                      <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{role === 'police' ? 'Upload Official ID / Badge' : 'Upload Aadhaar or Passport'} <span className="text-red-500">*</span></span>
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
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Step 3: Verify OTP</h2>

              {/* Email icon + address */}
              <div className="flex flex-col items-center gap-1">
                <div className={`p-3 rounded-full ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}><Mail size={24} className="text-blue-500" /></div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'bg-gray-500'}`}>6-digit code sent to</p>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{formData.email}</p>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>⏱ OTP valid for 10 minutes &nbsp;|&nbsp; Check spam if not received</p>
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
                    className={`w-12 h-14 text-center text-2xl font-black border-2 rounded-xl focus:border-blue-600 outline-none transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                  />
                ))}
              </div>

              <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-blue-700 transition flex justify-center gap-2 items-center disabled:opacity-70">
                {isLoading ? <><Loader2 size={20} className="animate-spin" /> Verifying...</> : <>Verify OTP <ArrowRight size={20}/></>}
              </button>

              {/* Resend OTP */}
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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
                  className={`font-bold hover:underline disabled:opacity-50 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                >
                  Resend OTP
                </button>
              </p>
            </form>
          )}

          {view === 'password' && (
            <form onSubmit={handleFinalSubmit} className="space-y-5 animate-fade-in text-center">
              <div className="flex justify-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-gray-200'}`}></div>
                <div className="w-8 h-2 bg-blue-600 rounded-full"></div>
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Final Step: Security</h2>
              <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Set a strong PIN to secure your identity</p>

              <div className="relative">
                 <Lock className={`absolute left-3 top-3.5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} size={20} />
                 <input type={showPassword ? "text" : "password"} placeholder="Create 6-digit PIN / Password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={`w-full border-2 rounded-xl p-3 pl-10 pr-12 focus:border-blue-500 outline-none font-medium transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-3.5 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                 </button>
              </div>
              
              <div className="relative mt-4">
                 <Lock className={`absolute left-3 top-3.5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} size={20} />
                 <input type={showPassword ? "text" : "password"} placeholder="Confirm PIN" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} className={`w-full border-2 rounded-xl p-3 pl-10 pr-12 focus:border-blue-500 outline-none font-medium transition-colors ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`} />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-3.5 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                 </button>
              </div>

              <button type="submit" className="w-full bg-green-600 text-white font-bold py-3.5 mt-6 rounded-xl shadow-lg hover:bg-green-700 transition flex justify-center gap-2 items-center">
                <CheckCircle2 size={20}/> Generate Digital ID
              </button>
            </form>
          )}

          {view === 'generating' && (
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className="w-20 h-20 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>Generating Digital ID...</h2>
              <div className={`space-y-3 text-sm font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                <p className="flex items-center justify-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> KYC Documents Verified</p>
                <p className="animate-pulse flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin text-blue-500" /> Creating Secure Account...</p>
                <p className="animate-pulse flex items-center justify-center gap-2" style={{animationDelay: '1s'}}><Loader2 size={16} className="animate-spin text-indigo-500" /> Syncing with Database...</p>
              </div>
            </div>
          )}

          {view === 'success' && (
            <div className="text-center py-6 space-y-6 animate-fade-in">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-2 ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'}`}>
                <CheckCircle2 size={40} />
              </div>
              <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>ID Generated!</h2>
              
              <div className={`border-2 border-dashed p-6 rounded-2xl relative ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-300'}`}>
                <p className={`text-xs uppercase font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{role === 'police' ? 'Your Administrator ID' : 'Your Sudarshan Digital ID'}</p>
                <p className={`text-3xl font-black tracking-widest ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{generatedId}</p>
              </div>
              
              <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Please note down this ID. You will use your <strong className={isDark ? 'text-slate-200' : 'text-gray-700'}>email & password</strong> to login.</p>
              
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