import React, { useEffect, useRef, useState } from 'react';
import { Settings as SettingsIcon, Bell, MapPin, Globe, Moon, Sun, ShieldAlert, DownloadCloud, WifiOff, Trash2 } from 'lucide-react';
import ChangePassword from './ChangePassword';
import { upsertSettings, getSettings } from '../supabase';

// 🌟 NAYA: Ab ye settings App.jsx se direct prop ke through aayengi
const SettingsView = ({ settings, setSettings, userId, onDeleteClick }) => {
  const isDark = settings.darkMode;
  const debounceRef = useRef(null);
  const [showPasswordSettings, setShowPasswordSettings] = useState(false);

  // Load settings from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const { data } = await getSettings(userId);
      if (data) {
        setSettings({
          darkMode: data.dark_mode ?? false,
          autoTranslate: data.auto_translate ?? false,
          autoSOS: data.auto_sos ?? true,
          notifications: data.notifications ?? true,
          offlineMaps: data.offline_maps ?? true,
        });
      }
    };
    load();
  }, [userId]);

  // Real-time toggle function
  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);

    // Debounced Supabase sync
    if (userId) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        upsertSettings(userId, {
          dark_mode: updated.darkMode,
          auto_translate: updated.autoTranslate,
          auto_sos: updated.autoSOS,
          notifications: updated.notifications,
          offline_maps: updated.offlineMaps,
        });
      }, 500);
    }
  };

  return (
    <div className={`max-w-3xl mx-auto rounded-3xl shadow-sm border overflow-hidden animate-fade-in transition-colors duration-500 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
      
      {/* Header */}
      <div className={`p-6 border-b flex items-center gap-4 transition-colors duration-500 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`p-3 rounded-2xl ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-white text-gray-600 shadow-sm'}`}>
          <SettingsIcon size={28} />
        </div>
        <div>
          <h2 className={`text-2xl font-black tracking-wide ${isDark ? 'text-white' : 'text-gray-800'}`}>Settings</h2>
          <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Manage your real-time preferences.</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Category 1: Appearance */}
        <div>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 pl-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Appearance</h3>
          <div className={`rounded-2xl border overflow-hidden transition-colors duration-500 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            
            {/* 🌟 REAL DARK MODE TOGGLE */}
            <div className={`flex justify-between items-center p-4 hover:bg-opacity-50 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-slate-700 text-yellow-400' : 'bg-blue-50 text-blue-600'}`}>
                  {isDark ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Dark Mode</h4>
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Switch app theme to dark.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.darkMode} onChange={() => handleToggle('darkMode')} />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* 🌟 AUTO-TRANSLATE TOGGLE */}
            <div className={`flex justify-between items-center p-4 border-t hover:bg-opacity-50 transition ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-100 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700 text-green-400' : 'bg-green-50 text-green-600'}`}><Globe size={20} /></div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Auto-Translate (Hindi)</h4>
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Hides manual language switch.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.autoTranslate} onChange={() => handleToggle('autoTranslate')} />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Category 2: Security & SOS */}
        <div>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 pl-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Security & Alerts</h3>
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            
            {/* 🌟 AUTO SOS TOGGLE */}
            <div className={`flex justify-between items-center p-4 hover:bg-opacity-50 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700 text-red-400' : 'bg-red-50 text-red-600'}`}><ShieldAlert size={20} /></div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Auto-SOS on Low Battery</h4>
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Trigger warning when battery &lt; 20%.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.autoSOS} onChange={() => handleToggle('autoSOS')} />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
              </label>
            </div>

            <div className={`flex justify-between items-center p-4 border-t hover:bg-opacity-50 transition ${isDark ? 'border-slate-700 hover:bg-slate-700' : 'border-gray-100 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700 text-orange-400' : 'bg-orange-50 text-orange-600'}`}><Bell size={20} /></div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Push Notifications</h4>
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Receive high-priority alerts on lock screen.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notifications} onChange={() => handleToggle('notifications')} />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Category 3: Data & Network */}
        <div>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 pl-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Data & Navigation</h3>
          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className={`flex justify-between items-center p-4 hover:bg-opacity-50 transition ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-slate-700 text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}><DownloadCloud size={20} /></div>
                <div>
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Auto-Download Maps</h4>
                  <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Save maps over Wi-Fi for remote areas.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.offlineMaps} onChange={() => handleToggle('offlineMaps')} />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Category 4: Account Management */}
        <div>
          <h3 className={`text-xs font-black uppercase tracking-widest mb-4 pl-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>Account Management</h3>
          <div className="space-y-6">
            
            <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>Change Password</h4>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Update your login credentials securely.</p>
                </div>
                <button 
                  onClick={() => setShowPasswordSettings(!showPasswordSettings)}
                  className={`px-6 py-3 font-bold rounded-xl flex items-center gap-2 transition ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
                >
                  {showPasswordSettings ? 'Hide' : 'Update Password'}
                </button>
              </div>
              {showPasswordSettings && (
                <div className="mt-6 border-t pt-6 border-slate-700">
                  <ChangePassword isDark={isDark} />
                </div>
              )}
            </div>

            <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-red-900/10 border-red-900' : 'bg-red-50 border-red-100'}`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-red-600 text-lg">Danger Zone</h4>
                  <p className={`text-sm font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>Permanently delete your account and all associated data.</p>
                </div>
                <button 
                  onClick={onDeleteClick}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center gap-2 transition"
                >
                  <Trash2 size={18} /> Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsView;