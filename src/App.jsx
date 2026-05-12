import React, { useState, useEffect, useRef } from 'react';
import LiveMap from './components/LiveMap';
import DigitalID from './components/DigitalID';
import RakshaAI from './components/RakshaAI';
import MiniGames from './components/MiniGames';
import TravelInfo from './components/TravelInfo'; 
import EmergencyContacts from './components/EmergencyContacts'; 
import Alerts from './components/Alerts'; 
import ChangePassword from './components/ChangePassword'; 
import SettingsView from './components/Settings'; 
import Profile from './components/Profile'; 
import AuthPage from './components/AuthPage'; 
import { authSignOut } from './supabase';
import { Menu, X, User, Lock, Trash2, Phone, Settings, Gamepad2, AlertTriangle, Briefcase, Bell, LogOut, CloudSun, Users, Building, Home, Navigation, Activity, ShieldAlert, ShieldCheck } from 'lucide-react';

const translations = {
  en: {
    touristApp: "📱 Tourist App", policeRoom: "🖥️ Police Control Room", sos: "🚨 SOS",
    safetyScoreTitle: "AI Personal Safety Score", statusSafe: "✅ Secure in Safe Zone", statusDanger: "⚠️ CRITICAL ANOMALY",
    dashboard: "Home", profile: "My Profile", travelInfo: "Travel Itinerary", emergency: "Emergency Contacts",
    alerts: "Alerts & Notifications", changePass: "Change Password", settings: "Settings", logout: "Log Out", deleteAcc: "Delete Account",
    weather: "Weather & Temp", crowd: "Crowd Density", hotel: "Accommodation", travelAlerts: "TRAVEL ALERTS",
    distance: "Distance:", timeToReach: "Est. Time:", globalMonitoring: "🌍 Global Geo-Spatial Monitoring", autoFir: "🚨 Auto E-FIR & Alerts"
  },
  hi: {
    touristApp: "📱 यात्री ऐप", policeRoom: "🖥️ पुलिस कंट्रोल ROOM", sos: "🚨 आपातकाल",
    safetyScoreTitle: "AI सुरक्षा स्कोर", statusSafe: "✅ आप सुरक्षित हैं", statusDanger: "⚠️ खतरा!",
    dashboard: "होम", profile: "मेरी प्रोफाइल", travelInfo: "यात्रा विवरण", emergency: "आपातकालीन संपर्क",
    alerts: "अलर्ट और सूचनाएं", changePass: "पासवर्ड बदलें", settings: "सेटिंग्स", logout: "लॉग आउट", deleteAcc: "खाता हटाएं",
    weather: "मौसम और तापमान", crowd: "भीड़ का घनत्व", hotel: "होटल विवरण", travelAlerts: "यात्रा अलर्ट",
    distance: "दूरी:", timeToReach: "अनुमानित समय:", globalMonitoring: "🌍 वैश्विक भू-स्थानिक निगरानी", autoFir: "🚨 ऑटो ई-एफआईआर और अलर्ट"
  }
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('sudarshan_auth') === 'true');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('sudarshan_role') || 'tourist'); 
  const [userProfile, setUserProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sudarshan_user')) || null; } catch { return null; }
  });

  const [lang, setLang] = useState('en'); 
  const t = translations[lang];

  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('sudarshan_settings');
    return saved ? JSON.parse(saved) : { darkMode: false, autoTranslate: false, autoSOS: true, notifications: true, offlineMaps: true };
  });

  useEffect(() => {
    localStorage.setItem('sudarshan_settings', JSON.stringify(appSettings));
    if (appSettings.autoTranslate) { setLang('hi'); } else { setLang('en'); }
  }, [appSettings]);

  const [activeView, setActiveView] = useState(() => {
    const role = localStorage.getItem('sudarshan_role');
    return role === 'police' ? 'police' : 'tourist';
  });

  const [showSosModal, setShowSosModal] = useState(false);
  const [showMiniGames, setShowMiniGames] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  
  const [itinerary, setItinerary] = useState({ source: "", dest: "", startDate: "", endDate: "", people: "", hotel: "" });
  const [safetyScore, setSafetyScore] = useState(100);
  const [isAreaSafe, setIsAreaSafe] = useState(true);
  const [incidentLogs, setIncidentLogs] = useState([]);

  // 🌍 REAL-TIME DATA STATES
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: 'CloudSun' });
  const [disasters, setDisasters] = useState([]);
  const [poiType, setPoiType] = useState(null);

  // Fetch Location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        }, 
        (err) => {
          console.warn("Geolocation error, using fallback:", err);
          setLocation({ lat: 28.6139, lon: 77.2090 }); // Fallback to New Delhi
        },
        { timeout: 10000 }
      );
    } else {
      setLocation({ lat: 28.6139, lon: 77.2090 });
    }
  }, []);

  // Fetch Weather (Open-Meteo)
  useEffect(() => {
    if (!location) return;
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather) {
          setWeather({
            temp: Math.round(data.current_weather.temperature),
            condition: data.current_weather.weathercode === 0 ? 'Clear Sky' : 'Partly Cloudy',
            icon: 'CloudSun'
          });
        }
      } catch (err) { console.error("Weather error:", err); }
    };
    fetchWeather();
  }, [location]);

  // Fetch Global Disaster Alerts (GDACS)
  const fetchAlerts = async () => {
    try {
      const res = await fetch('https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP?eventlist=EQ,TC,FL,VW,VO,DR');
      const data = await res.json();
      const uniqueEvents = new Map();
      (data.features || []).forEach(f => {
        const id = f.properties?.eventid || f.properties?.eventname;
        if (id && !uniqueEvents.has(id)) {
          uniqueEvents.set(id, {
            id: f.properties?.eventid || Math.random(),
            name: f.properties?.eventname || 'Unknown Event',
            type: f.properties?.eventtype || 'Alert',
            level: f.properties?.alertlevel || 'Green',
            country: f.properties?.country || 'Global',
            date: f.properties?.fromdate,
            lon: f.geometry?.coordinates?.[0] || 0,
            lat: f.geometry?.coordinates?.[1] || 0
          });
        }
      });
      const mapped = Array.from(uniqueEvents.values());
      setDisasters(mapped);
      
      const realLogs = mapped.slice(0, 5).map((d, index) => {
        let timeStr = "Just Now";
        try {
          if (d.date) {
            const dDate = new Date(d.date);
            if (!isNaN(dDate.getTime())) {
              timeStr = dDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
          }
        } catch (e) { console.error("Date error:", e); }

        return {
          id: `GLOBAL-${d.id}-${index}`,
          time: timeStr,
          type: `${d.type}: ${d.name}`,
          status: `Alert Level: ${d.level}`,
          color: d.level === 'Red' ? 'text-red-600 font-bold' : 'text-orange-500'
        };
      });
      setIncidentLogs(realLogs);
    } catch (err) { console.error("Alerts error:", err); }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 300000);
    return () => clearInterval(interval);
  }, []);

  const [sosPinInput, setSosPinInput] = useState('');
  const [sosError, setSosError] = useState('');

  // ML-Style Safety Score Calculation
  const calculateSafetyScore = () => {
    let score = 98; // Base score
    if (disasters && disasters.length > 0) {
      const redAlerts = disasters.filter(d => d.level === 'Red').length;
      const orangeAlerts = disasters.filter(d => d.level === 'Orange').length;
      score -= (redAlerts * 15) + (orangeAlerts * 5);
    }
    if (weather) {
      if (parseFloat(weather.temp) > 40 || parseFloat(weather.temp) < 0) score -= 10;
      if (weather.condition?.toLowerCase().includes('rain')) score -= 5;
      if (weather.condition?.toLowerCase().includes('storm')) score -= 15;
    }
    const finalScore = Math.max(20, Math.min(100, Math.round(score)));
    setSafetyScore(finalScore);
    setIsAreaSafe(finalScore > 60);
  };

  useEffect(() => {
    calculateSafetyScore();
  }, [weather, disasters]);

  const handleMapAlert = (safeStatus) => {
    // Optional manual override from map
  };

  const [showSosSuccess, setShowSosSuccess] = useState(false);
  const [sosHoldProgress, setSosHoldProgress] = useState(0);
  const [sosBioBusy, setSosBioBusy] = useState(false);
  const sosHoldIntervalRef = useRef(null);
  const sosHoldStartRef = useRef(null);

  const triggerSOS = (forceBypass = false) => {
    if (forceBypass || sosPinInput === userProfile?.pin) { 
      setShowSosSuccess(true);
      setShowSosModal(false);
      setSosPinInput('');
      setSosError('');
      // Auto-hide success modal after 5 seconds
      setTimeout(() => setShowSosSuccess(false), 5000);
    } else {
      setSosError("❌ Incorrect PIN/Password!");
    }
  };

  const clearSosHold = () => {
    if (sosHoldIntervalRef.current) {
      clearInterval(sosHoldIntervalRef.current);
      sosHoldIntervalRef.current = null;
    }
    sosHoldStartRef.current = null;
    setSosHoldProgress(0);
  };

  const startSosHold = () => {
    if (sosHoldIntervalRef.current) return;
    sosHoldStartRef.current = Date.now();
    sosHoldIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (sosHoldStartRef.current || Date.now());
      const progress = Math.min(100, Math.round((elapsed / 2000) * 100));
      setSosHoldProgress(progress);
      if (progress >= 100) {
        clearSosHold();
        triggerSOS(true);
      }
    }, 50);
  };

  useEffect(() => {
    return () => {
      if (sosHoldIntervalRef.current) {
        clearInterval(sosHoldIntervalRef.current);
      }
    };
  }, []);

  const verifyBiometric = async () => {
    if (!window.PublicKeyCredential) return false;
    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Sudarshan Safety", id: window.location.hostname },
          user: {
            id: new Uint8Array(16),
            name: userProfile?.name || "User",
            displayName: userProfile?.name || "User"
          },
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
          timeout: 60000,
          authenticatorSelection: { userVerification: "required" }
        }
      });
      return true;
    } catch (err) {
      console.warn("Biometric failed:", err);
      return false;
    }
  };

  const handleBiometricSOS = async () => {
    setShowSosModal(false);
    const ok = await verifyBiometric();
    if (ok) triggerSOS(true);
    else {
      alert("Biometric failed. Use PIN.");
      setShowSosModal(true);
    }
  };

  const handleInstantSOS = async () => {
    if (sosBioBusy) return;
    setSosBioBusy(true);
    try {
      if (!window.PublicKeyCredential) {
        setShowSosModal(true);
        return;
      }
      const ok = await verifyBiometric();
      if (ok) triggerSOS(true);
      else setShowSosModal(true);
    } finally {
      setSosBioBusy(false);
    }
  };

  const getMenuClass = (viewName) => {
    const isActive = activeView === viewName;
    return `w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : (appSettings.darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100')}`;
  };

  const handleLoginSuccess = (userData, role) => {
    setUserProfile(userData); setUserRole(role); setActiveView(role === 'police' ? 'police' : 'tourist'); setIsLoggedIn(true);
    localStorage.setItem('sudarshan_auth', 'true'); localStorage.setItem('sudarshan_role', role); localStorage.setItem('sudarshan_user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    await authSignOut();
    setIsLoggedIn(false); setUserProfile(null); setShowLogoutModal(false);
    localStorage.removeItem('sudarshan_auth'); localStorage.removeItem('sudarshan_role'); localStorage.removeItem('sudarshan_user');
  };

  if (!isLoggedIn) return <AuthPage onLogin={handleLoginSuccess} />;

  const isDark = appSettings.darkMode;
  const severeAlerts = disasters.filter((d) => d.level === 'Red' || d.level === 'Orange').length;
  const safetyReason = severeAlerts > 0
    ? `${severeAlerts} nearby severe global alert(s) detected`
    : weather?.condition?.toLowerCase().includes('rain') || weather?.condition?.toLowerCase().includes('storm')
      ? `Weather risk detected: ${weather.condition}`
      : 'No severe risk indicator in current feed';

  return (
    <div className={`h-screen font-sans flex overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* SIDEBAR */}
      <div className={`h-full shadow-2xl flex flex-col z-50 transition-all duration-300 ${isSidebarOpen ? 'w-72 border-r' : 'w-0 border-none overflow-hidden'} ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="w-72 flex flex-col h-full">
          <div className="bg-blue-900 p-6 text-white flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-900 font-black text-xl overflow-hidden shadow-sm flex-shrink-0">
                {userProfile?.avatar ? (
                  <img src={userProfile.avatar} alt="P" className="w-full h-full object-cover" />
                ) : (
                  userProfile?.name && userProfile.name.length > 0 ? userProfile.name[0].toUpperCase() : 'U'
                )}
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold truncate text-sm">{userProfile?.name || 'Guest User'}</h2>
                <span className="text-[10px] text-blue-200 uppercase font-bold tracking-widest">{userProfile?.id || 'SU-PENDING'}</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden"><X size={24} /></button>
          </div>
          
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button onClick={() => setActiveView(userRole === 'police' ? 'police' : 'tourist')} className={getMenuClass(userRole === 'police' ? 'police' : 'tourist')}><Home size={20}/> {t.dashboard}</button>
            {userRole === 'tourist' && (
              <>
                <button onClick={() => setActiveView('digitalId')} className={getMenuClass('digitalId')}><ShieldCheck size={20}/> Digital ID</button>
                <button onClick={() => setActiveView('profile')} className={getMenuClass('profile')}><User size={20}/> {t.profile}</button>
                <button onClick={() => setActiveView('travelInfo')} className={getMenuClass('travelInfo')}><Briefcase size={20}/> {t.travelInfo}</button>
                <button onClick={() => setActiveView('emergencyContacts')} className={getMenuClass('emergencyContacts')}><Phone size={20}/> {t.emergency}</button>
              </>
            )}
            <button onClick={() => setActiveView('alerts')} className={getMenuClass('alerts')}><Bell size={20}/> {t.alerts}</button>
            <button onClick={() => setActiveView('settings')} className={getMenuClass('settings')}><Settings size={20}/> {t.settings}</button>
            <button onClick={() => setShowLogoutModal(true)} className={`w-full flex items-center gap-3 p-3 font-bold rounded-xl mt-4 transition-all ${isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}><LogOut size={20}/> {t.logout}</button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <nav className={`px-6 py-4 shadow-sm flex justify-between items-center sticky top-0 z-40 ${isDark ? 'bg-slate-950 border-b border-slate-800' : 'bg-white border-b border-gray-200'}`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}><Menu size={24} /></button>
            <div className="flex flex-col cursor-pointer" onClick={() => setActiveView(userRole === 'police' ? 'police' : 'tourist')}>
              <span className="text-xl font-black tracking-widest uppercase">SUDARSHAN</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase -mt-1">Smart Tourist Safety</span>
            </div>
          </div>
          {userRole === 'tourist' && (
            <button 
              onMouseDown={startSosHold}
              onMouseUp={clearSosHold}
              onMouseLeave={clearSosHold}
              onTouchStart={startSosHold}
              onTouchEnd={clearSosHold}
              onContextMenu={(e) => e.preventDefault()}
              onDoubleClick={handleBiometricSOS}
              className="bg-red-600 text-white px-6 py-2 rounded-xl font-black shadow-lg relative overflow-hidden select-none"
              title="Press and hold for 2 seconds to trigger SOS. Double click for biometric."
            >
              <span
                className="absolute left-0 top-0 h-full bg-red-800/60 transition-all"
                style={{ width: `${sosHoldProgress}%` }}
              />
              <span className="relative z-10">
                {sosHoldProgress > 0 ? `HOLD ${Math.max(1, Math.ceil((100 - sosHoldProgress) / 50))}s` : t.sos}
              </span>
            </button>
          )}
        </nav>

        <div className="flex-1 p-4 md:p-6 pb-24">
          {activeView === 'tourist' && userRole === 'tourist' && (
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
              {/* TOP ROW: Welcome, Weather, Safety Score */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`col-span-1 md:col-span-2 p-8 rounded-3xl shadow-sm border relative overflow-hidden flex flex-col justify-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>Welcome, {userProfile?.name ? userProfile.name.split(' ')[0] : 'Traveler'}!</h1>
                  <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Your AI Safety Companion is active and monitoring.</p>
                  <p className={`text-xs mt-3 font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    Safety Insight: {safetyReason}
                  </p>
                </div>

                <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
                  <h3 className="text-[10px] font-black uppercase text-blue-600 mb-2">{t.weather}</h3>
                  <div className="flex items-center gap-3">
                    <CloudSun size={36} className="text-blue-500" />
                    <div>
                      <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{weather.temp}°C</p>
                      <p className={`text-xs font-bold opacity-60 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{weather.condition}</p>
                    </div>
                  </div>
                </div>

                <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-center relative overflow-hidden ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent'}`}>
                  <Activity size={100} className="absolute -right-4 -bottom-4 opacity-10" />
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-2">AI Safety Score</span>
                  <div className="text-4xl font-black flex items-baseline gap-1">
                    {safetyScore} <span className="text-sm font-bold opacity-70">/ 100</span>
                  </div>
                  <div className="text-xs font-bold mt-2 opacity-90">{isAreaSafe ? '✅ Optimal Conditions' : '⚠️ Exercise Caution'}</div>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => void handleInstantSOS()}
                  disabled={sosBioBusy}
                  className="w-full rounded-2xl py-4 px-4 bg-red-600 text-white font-black shadow-lg hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-wait"
                >
                  {sosBioBusy ? "⏳ Confirming biometric…" : "🚨 Instant SOS"}
                  <div className="text-[10px] font-bold opacity-80 mt-1">
                    {sosBioBusy
                      ? "Complete fingerprint / face / device prompt"
                      : "Confirm with biometric, then sends live location (PIN if unavailable)"}
                  </div>
                </button>
              </div>

              {/* MIDDLE ROW: Map & Interactions */}
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                    <h2 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Live Geo-Spatial Map</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Find:</span>
                      <button onClick={() => setPoiType('Hospitals')} className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${poiType === 'Hospitals' ? 'bg-red-600 text-white' : (isDark ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}`}>🏥 Hospitals</button>
                      <button onClick={() => setPoiType('Police')} className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${poiType === 'Police' ? 'bg-blue-600 text-white' : (isDark ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}`}>🚓 Police</button>
                    </div>
                  </div>
                  
                  <div className={`rounded-3xl border shadow-sm overflow-hidden h-[450px] relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                    <LiveMap onAlert={handleMapAlert} userLocation={location} globalAlerts={disasters} poiType={poiType} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'police' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <div className="xl:col-span-2 h-[600px] border rounded-3xl overflow-hidden">
                <LiveMap viewMode="police" userLocation={location} globalAlerts={disasters} />
              </div>
              <div className="h-[600px] border rounded-3xl overflow-y-auto">
                <div className="p-4 border-b font-black sticky top-0 bg-inherit z-10">LIVE INCIDENT LOGS</div>
                {incidentLogs.map((log, i) => (
                  <div key={i} className="p-4 border-b hover:bg-gray-50 transition">
                    <p className="text-[10px] font-mono text-blue-500 font-bold">{log.id} • {log.time}</p>
                    <p className="font-bold text-sm">{log.type}</p>
                    <p className={`text-[10px] font-bold ${log.color}`}>{log.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'digitalId' && <DigitalID user={userProfile} isDark={isDark} />}
          {activeView === 'profile' && <Profile user={userProfile} setUser={setUserProfile} isDark={isDark} userId={userProfile?.supabaseId} />}
          {activeView === 'travelInfo' && <TravelInfo itinerary={itinerary} setItinerary={setItinerary} isDark={isDark} userId={userProfile?.supabaseId} />}
          {activeView === 'emergencyContacts' && <EmergencyContacts isDark={isDark} userId={userProfile?.supabaseId} />}
          {activeView === 'alerts' && <Alerts disasters={disasters} isDark={isDark} onRefresh={fetchAlerts} />}
          {activeView === 'settings' && <SettingsView settings={appSettings} setSettings={setAppSettings} isDark={isDark} userId={userProfile?.supabaseId} onDeleteClick={() => setShowDeleteModal(true)} />}
        </div>

        <div className={`mt-auto sticky bottom-0 border-t z-50 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="bg-red-600 text-white py-2">
            <marquee className="text-sm font-bold tracking-widest uppercase">
              {disasters && disasters.length > 0 ? disasters.map(d => `🚨 ${d.type === 'EQ' ? 'EARTHQUAKE' : d.type === 'TC' ? 'CYCLONE' : d.type === 'FL' ? 'FLOOD' : d.type === 'VO' ? 'VOLCANO' : 'ALERT'} IN ${d.country || 'GLOBAL ZONE'} (${d.level || 'Monitoring'})`).join('     •     ') : "Global Systems Online. No severe alerts at this moment."}
            </marquee>
          </div>
          <div className="p-4 flex justify-between items-center max-w-7xl mx-auto">
            <button onClick={() => setShowMiniGames(true)} className="flex items-center gap-2 font-black text-xs text-indigo-600"><Gamepad2 size={16}/> GAMES ZONE</button>
            <RakshaAI weather={weather} location={location} disasters={disasters} isDark={isDark} />
          </div>
        </div>
      </div>

      {showMiniGames && <MiniGames onClose={() => setShowMiniGames(false)} />}

      {showSosModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm">
          <div className={`rounded-3xl p-8 max-w-sm w-full text-center border-4 border-red-600 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <h2 className="text-3xl font-black text-red-600 mb-4">SOS TRIGGER</h2>
            <input 
              type="password" 
              placeholder="ENTER PIN" 
              value={sosPinInput}
              onChange={(e) => setSosPinInput(e.target.value)}
              className={`w-full border-2 rounded-xl p-4 text-center text-3xl mb-4 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
            />
            {sosError && <p className="text-red-500 font-bold mb-4">{sosError}</p>}
            <div className="flex gap-4">
              <button onClick={() => setShowSosModal(false)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>CANCEL</button>
              <button onClick={() => triggerSOS(false)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700">TRIGGER</button>
            </div>
          </div>
        </div>
      )}

      {showSosSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm animate-fade-in">
          <div className="bg-red-600 text-white rounded-3xl p-8 max-w-md w-full text-center border-4 border-red-800 shadow-2xl animate-bounce">
            <AlertTriangle size={60} className="mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-2">SOS TRIGGERED</h2>
            <p className="text-lg font-bold opacity-90">Authorities and emergency contacts have been alerted.</p>
            <p className="text-sm mt-4 opacity-75">Stay calm. Help is on the way.</p>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm">
          <div className={`rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <h2 className="text-2xl font-black mb-4">Logout?</h2>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowLogoutModal(false)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>No</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;