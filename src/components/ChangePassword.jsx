import React, { useState } from 'react';
import { Lock, Save, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { authChangePassword } from '../supabase';

const ChangePassword = ({ isDark }) => {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showSaved, setShowSaved] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    
    if (passwords.new !== passwords.confirm) {
      setError("❌ Passwords do not match!");
      return;
    }
    if (passwords.new.length < 6) {
      setError("❌ Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    // Update password via Supabase
    const { error: updateError } = await authChangePassword(passwords.new);
    
    if (updateError) {
      setError(`❌ Failed to update password: ${updateError.message}`);
      setIsLoading(false);
      return;
    }

    setShowSaved(true);
    setPasswords({ current: '', new: '', confirm: '' });
    setIsLoading(false);
    setTimeout(() => setShowSaved(false), 3000);
  };

  return (
    <div className="w-full mx-auto animate-fade-in">

      <div className={`rounded-3xl shadow-sm border p-8 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        
        {error && <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 font-bold text-sm border ${isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-50 text-red-600 border-red-200'}`}><AlertCircle size={18}/> {error}</div>}
        {showSaved && <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 font-bold text-sm border ${isDark ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-50 text-green-700 border-green-200'}`}><CheckCircle2 size={18}/> Password updated successfully!</div>}

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Current Password</label>
            <input type="password" name="current" value={passwords.current} onChange={handleChange} required placeholder="••••••••" className={`w-full border-2 rounded-xl p-3 focus:border-indigo-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>New Password</label>
            <input type="password" name="new" value={passwords.new} onChange={handleChange} required placeholder="••••••••" className={`w-full border-2 rounded-xl p-3 focus:border-indigo-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
          </div>
          <div>
            <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Confirm New Password</label>
            <input type="password" name="confirm" value={passwords.confirm} onChange={handleChange} required placeholder="••••••••" className={`w-full border-2 rounded-xl p-3 focus:border-indigo-500 outline-none font-medium ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'border-gray-200'}`} />
          </div>
          
          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-70">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;