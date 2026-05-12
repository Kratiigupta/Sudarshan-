import React from 'react';
import { Shield, CheckCircle2, User, Calendar, MapPin, Activity, Fingerprint, Lock, ShieldCheck } from 'lucide-react';

const DigitalID = ({ user, isDark }) => {
  // Generate a mock blockchain hash based on user ID
  const generateHash = (id) => {
    let str = id + "SUDARSHAN-BLOCKCHAIN-SALT";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; 
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(12, '0');
  };

  const bHash = generateHash(user?.id || 'GUEST');

  return (
    <div className={`flex flex-col items-center justify-center min-h-[80vh] p-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black mb-2 uppercase tracking-widest flex items-center justify-center gap-3">
          <ShieldCheck className="text-blue-500" size={32} />
          Digital Tourist ID
        </h2>
        <p className={`text-sm font-bold opacity-70 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Blockchain Verified & Secured</p>
      </div>

      {/* ID Card Wrapper */}
      <div className={`w-full max-w-md rounded-[2.5rem] p-1 border shadow-2xl relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600' : 'bg-gradient-to-br from-blue-100 to-white border-blue-200'}`}>
        
        {/* Holographic background effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-400/10 to-transparent mix-blend-overlay pointer-events-none"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className={`rounded-[2.4rem] p-8 relative z-10 ${isDark ? 'bg-slate-900/90 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-xl'}`}>
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Sudarshan Pass</p>
              <h3 className="text-2xl font-black">{user?.id || 'SU-PENDING'}</h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-100 border border-gray-200'}`}>
               <Fingerprint size={28} className="text-blue-500" />
            </div>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Full Name</p>
              <p className="font-bold text-sm truncate">{user?.name || 'Guest User'}</p>
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Date of Birth</p>
              <p className="font-bold text-sm">{user?.dob || 'Verified'}</p>
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Phone</p>
              <p className="font-bold text-sm truncate">{user?.phone || 'Linked'}</p>
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Valid Until</p>
              <p className="font-bold text-sm text-green-500">Trip End Date</p>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent mb-8"></div>

          {/* Blockchain & Status */}
          <div className="flex flex-col gap-4">
            <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDark ? 'bg-green-900/20 border border-green-900/50' : 'bg-green-50 border border-green-100'}`}>
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white flex-shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-green-600 dark:text-green-500">KYC Verified</p>
                <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Aadhaar / Passport Authenticated</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl flex items-center gap-4 ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-blue-500 flex-shrink-0">
                <Lock size={20} />
              </div>
              <div className="overflow-hidden">
                <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Blockchain Hash</p>
                <p className="text-xs font-mono font-bold truncate text-blue-600 dark:text-blue-400">0x{bHash}...A9B2</p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      <p className={`mt-8 text-xs font-bold tracking-widest uppercase text-center max-w-sm opacity-50`}>
        Show this ID to authorities at Checkposts for express clearance.
      </p>

    </div>
  );
};

export default DigitalID;