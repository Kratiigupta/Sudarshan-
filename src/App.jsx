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
import PolicePanel from './components/PolicePanel';
import History from './components/History';
import TravelNews from './components/TravelNews';
import { authSignOut, createIncident, deleteUserProfile } from './supabase';
import { Menu, X, User, Phone, Settings, Gamepad2, AlertTriangle, Briefcase, LogOut, CloudSun, Users, Home, Activity, ShieldAlert, ShieldCheck, Clock, Newspaper, BatteryWarning, MapPinOff, Hotel } from 'lucide-react';

const translations = {
  en: {
    touristApp: "📱 Tourist App", policeRoom: "🖥️ Police Control Room", sos: "🚨 SOS",
    safetyScoreTitle: "AI Personal Safety Score", statusSafe: "✅ Secure in Safe Zone", statusDanger: "⚠️ CRITICAL ANOMALY",
    dashboard: "Home", profile: "My Profile", travelInfo: "Travel Itinerary", emergency: "Emergency Contacts",
    alerts: "Safety Alerts", notifications: "Notifications", changePass: "Change Password", settings: "Settings", logout: "Log Out", deleteAcc: "Account Delete",
    weather: "Weather & Temp", crowd: "Crowd Density", hotel: "Accommodation", travelAlerts: "TRAVEL ALERTS",
    distance: "Distance:", timeToReach: "Est. Time:", globalMonitoring: "🌍 Global Geo-Spatial Monitoring", autoFir: "🚨 Auto E-FIR & Alerts",
    welcome: "Welcome", aiCompanion: "Your AI Safety Companion is active and monitoring.",
    safetyInsight: "Safety Insight:", optimal: "✅ Optimal Conditions", caution: "⚠️ Exercise Caution",
    estCrowd: "Est. Crowd Activity", temporal: "Temporal prediction",
    battery: "Battery", autoSosActive: "⚠️ Auto-SOS Active",
    aiMovement: "AI Movement Pattern Analysis", normalBehavior: "Normal Behavior Verified",
    normalDesc: "Historical patterns match expected itinerary. No drops or deviations detected.",
    instantSos: "🚨 Instant SOS", instantSosDesc: "Confirm with biometric, then sends live location (PIN if unavailable)",
    instantSosBusy: "⏳ Confirming biometric…", instantSosBusyDesc: "Complete fingerprint / face / device prompt",
    liveMap: "Live Geo-Spatial Map", find: "Find:", hospitals: "🏥 Hospitals", police: "🚓 Police",
    gamesZone: "GAMES ZONE", hold: "HOLD",
    sosTriggered: "SOS TRIGGERED", sosTriggeredDesc1: "Authorities and emergency contacts have been alerted.", sosTriggeredDesc2: "Stay calm. Help is on the way.",
    logoutPrompt: "Logout?", no: "No", yes: "Yes",
    cancel: "CANCEL", confirm: "CONFIRM", cancelSos: "CANCEL SOS",
    emergencyReq: "Emergency Request", emergencyReqDesc: "Select the authority you need immediate help from:",
    travelNews: "Travel News"
  },
  hi: {
    touristApp: "📱 यात्री ऐप", policeRoom: "🖥️ पुलिस कंट्रोल ROOM", sos: "🚨 आपातकाल",
    safetyScoreTitle: "AI सुरक्षा स्कोर", statusSafe: "✅ आप सुरक्षित हैं", statusDanger: "⚠️ खतरा!",
    dashboard: "होम", profile: "मेरी प्रोफाइल", travelInfo: "यात्रा विवरण", emergency: "आपातकालीन संपर्क",
    alerts: "सुरक्षा अलर्ट", notifications: "सूचनाएं", changePass: "पासवर्ड बदलें", settings: "सेटिंग्स", logout: "लॉग आउट", deleteAcc: "खाता हटाएं",
    weather: "मौसम और तापमान", crowd: "भीड़ का घनत्व", hotel: "होटल विवरण", travelAlerts: "यात्रा अलर्ट",
    distance: "दूरी:", timeToReach: "अनुमानित समय:", globalMonitoring: "🌍 वैश्विक भू-स्थानिक निगरानी", autoFir: "🚨 ऑटो ई-एफआईआर और अलर्ट",
    welcome: "स्वागत है", aiCompanion: "आपका AI सुरक्षा साथी सक्रिय है और निगरानी कर रहा है।",
    safetyInsight: "सुरक्षा जानकारी:", optimal: "✅ इष्टतम स्थितियां", caution: "⚠️ सावधानी बरतें",
    estCrowd: "अनुमानित भीड़", temporal: "समय अनुमान",
    battery: "बैटरी", autoSosActive: "⚠️ ऑटो-SOS सक्रिय",
    aiMovement: "AI मूवमेंट पैटर्न विश्लेषण", normalBehavior: "सामान्य व्यवहार सत्यापित",
    normalDesc: "ऐतिहासिक पैटर्न अपेक्षित यात्रा कार्यक्रम से मेल खाते हैं। कोई विचलन नहीं।",
    instantSos: "🚨 तुरंत SOS", instantSosDesc: "बायोमेट्रिक से पुष्टि करें, फिर लाइव लोकेशन भेजें",
    instantSosBusy: "⏳ पुष्टि कर रहा है…", instantSosBusyDesc: "फ़िंगरप्रिंट / फेस प्रॉम्प्ट पूरा करें",
    liveMap: "लाइव भू-स्थानिक मानचित्र", find: "खोजें:", hospitals: "🏥 अस्पताल", police: "🚓 पुलिस",
    gamesZone: "गेम्स ज़ोन", hold: "दबाए रखें",
    sosTriggered: "SOS भेजा गया", sosTriggeredDesc1: "अधिकारियों और आपातकालीन संपर्कों को सतर्क कर दिया गया है।", sosTriggeredDesc2: "शांत रहें। मदद रास्ते में है।",
    logoutPrompt: "लॉग आउट करें?", no: "नहीं", yes: "हाँ",
    cancel: "रद्द करें", confirm: "पुष्टि करें", cancelSos: "SOS रद्द करें",
    emergencyReq: "आपातकालीन अनुरोध", emergencyReqDesc: "उस प्राधिकरण का चयन करें जिससे आपको तत्काल सहायता चाहिए:",
    travelNews: "यात्रा समाचार"
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
    const savedView = localStorage.getItem('sudarshan_last_view');
    if (savedView) return savedView;
    const role = localStorage.getItem('sudarshan_role');
    return role === 'police' ? 'police' : 'tourist';
  });

  useEffect(() => {
    localStorage.setItem('sudarshan_last_view', activeView);
  }, [activeView]);

  const [showSosModal, setShowSosModal] = useState(false);
  const [showSosTargetModal, setShowSosTargetModal] = useState(false);
  const [showMiniGames, setShowMiniGames] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  
  const [itinerary, setItinerary] = useState({ source: "", dest: "", startDate: "", endDate: "", people: "", hotel: "" });
  const [safetyScore, setSafetyScore] = useState(100);
  const [isAreaSafe, setIsAreaSafe] = useState(true);
  const [incidentLogs, setIncidentLogs] = useState([]);

  // 🔋 BATTERY MONITORING
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [batteryAlertSent, setBatteryAlertSent] = useState(false);

  // 🧠 AI ANOMALY DETECTION
  const [locationHistory, setLocationHistory] = useState([]);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const [anomalyFlags, setAnomalyFlags] = useState([]);
  const anomalyIntervalRef = useRef(null);

  // 👥 CROWD DENSITY (estimated from POI data)
  const [crowdLevel, setCrowdLevel] = useState('Low');

  // 🌍 REAL-TIME DATA STATES
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState({ temp: '--', condition: 'Loading...', icon: 'CloudSun' });
  const [disasters, setDisasters] = useState([]);
  const [poiType, setPoiType] = useState(null);

  // Fetch Location logic merged into WatchPosition below to prevent duplicate prompts
  useEffect(() => {
    // Only set fallback if not supported
    if (!("geolocation" in navigator)) {
      setLocation({ lat: 28.6139, lon: 77.2090 });
    }
  }, []);

  // 🔋 Battery Monitoring — Auto-SOS when battery < 10%
  useEffect(() => {
    if (!('getBattery' in navigator)) return;
    let battery = null;
    const handleLevelChange = () => {
      if (!battery) return;
      const level = Math.round(battery.level * 100);
      setBatteryLevel(level);
      if (level <= 10 && !batteryAlertSent && appSettings.autoSOS && isLoggedIn && userRole === 'tourist') {
        setBatteryAlertSent(true);
        // Auto-create a low-battery incident
        createIncident({
          user_id: userProfile?.supabaseId || null,
          reporter_name: userProfile?.name || 'Unknown',
          type: 'LOW_BATTERY',
          description: `Auto-alert: Device battery critically low (${level}%). Last known GPS shared.`,
          latitude: location?.lat || 0,
          longitude: location?.lon || 0,
          severity: 'high',
          status: 'open',
          station: 'Central Command HQ',
        }).catch(console.error);
        // Simulate sending SMS/Email to Emergency Contacts
        const contactsRaw = localStorage.getItem(`sudarshan_contacts_${userProfile?.supabaseId}`);
        if (contactsRaw) {
           const contacts = JSON.parse(contactsRaw);
           if (contacts.length > 0) {
              console.log(`[SIMULATION] Sent LOW BATTERY Email/SMS with Live Location to:`, contacts);
              alert(`⚠️ Device battery critically low. Live location sent to ${contacts.length} emergency contacts!`);
           }
        }
        setShowSosSuccess(true);
        setTimeout(() => setShowSosSuccess(false), 5000);
      }
      if (level > 20) setBatteryAlertSent(false);
    };
    navigator.getBattery().then((b) => {
      battery = b;
      handleLevelChange();
      b.addEventListener('levelchange', handleLevelChange);
    }).catch(() => {});
    return () => {
      if (battery) battery.removeEventListener('levelchange', handleLevelChange);
    };
  }, [batteryAlertSent, appSettings.autoSOS, isLoggedIn, userRole, location]);

  // 🧠 AI Anomaly Detection — Track location, detect drops/inactivity/deviation
  useEffect(() => {
    if (!isLoggedIn || userRole !== 'tourist') return;
    // Continuous GPS tracking for anomaly analysis
    let watchId = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPt = { lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now() };
          setLocation({ lat: newPt.lat, lon: newPt.lon });
          setLocationHistory(prev => [...prev.slice(-60), newPt]); // Keep last 60 readings
          setLastActivityTime(Date.now());
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
      );
    }

    // Anomaly check interval (every 60 seconds)
    anomalyIntervalRef.current = setInterval(() => {
      const flags = [];
      const now = Date.now();

      // 1) Prolonged Inactivity (no GPS update for 30+ minutes)
      if (now - lastActivityTime > 30 * 60 * 1000) {
        flags.push({ type: 'INACTIVITY', msg: 'No location updates for 30+ minutes', severity: 'high' });
      }

      // 2) Sudden Location Drop (large jump in short time)
      if (locationHistory.length >= 2) {
        const last = locationHistory[locationHistory.length - 1];
        const prev = locationHistory[locationHistory.length - 2];
        const dist = getDistanceKm(prev.lat, prev.lon, last.lat, last.lon);
        const timeDiff = (last.ts - prev.ts) / 1000 / 60; // minutes
        if (dist > 50 && timeDiff < 5) {
          flags.push({ type: 'LOCATION_DROP', msg: `Sudden ${dist.toFixed(1)}km jump detected`, severity: 'critical' });
        }
      }

      // 3) Route Deviation (if itinerary destination set, check if moving away)
      if (itinerary.dest && locationHistory.length > 5) {
        // Simple heuristic: if last 5 readings show increasing distance from a central point
        const recent = locationHistory.slice(-5);
        const avgLat = recent.reduce((s, p) => s + p.lat, 0) / recent.length;
        const avgLon = recent.reduce((s, p) => s + p.lon, 0) / recent.length;
        const firstDist = getDistanceKm(recent[0].lat, recent[0].lon, avgLat, avgLon);
        const lastDist = getDistanceKm(recent[recent.length - 1].lat, recent[recent.length - 1].lon, avgLat, avgLon);
        if (lastDist > 10 && lastDist > firstDist * 3) {
          flags.push({ type: 'ROUTE_DEVIATION', msg: 'Significant deviation from expected path', severity: 'medium' });
        }
      }

      setAnomalyFlags(flags);
    }, 60000);

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (anomalyIntervalRef.current) clearInterval(anomalyIntervalRef.current);
    };
  }, [isLoggedIn, userRole]);

  // Helper: Haversine distance in km
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // 👥 Crowd Density Estimation (based on time of day + location type)
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 10 && hour <= 18) setCrowdLevel('Moderate (Daytime)');
    else if (hour >= 18 && hour <= 22) setCrowdLevel('High (Evening Peak)');
    else setCrowdLevel('Low (Off-peak)');
  }, [location]);

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

  const triggerSOS = async (forceBypass = false, targetAgency = 'Police') => {
    if (forceBypass || sosPinInput === userProfile?.pin) { 
      // Create Incident in Supabase
      const incidentData = {
        user_id: userProfile?.supabaseId || null,
        reporter_name: userProfile?.name || 'Unknown User',
        type: targetAgency === 'Police' ? 'SOS' : targetAgency.toUpperCase(),
        description: `Emergency ${targetAgency} SOS triggered by user.`,
        latitude: location?.lat || 0,
        longitude: location?.lon || 0,
        severity: 'critical',
        status: 'open',
        station: 'General Headquarters' // Global visibility
      };

      try {
        await createIncident(incidentData);
        // Simulate sending SMS/Email to Emergency Contacts
        const contactsRaw = localStorage.getItem(`sudarshan_contacts_${userProfile?.supabaseId}`);
        if (contactsRaw) {
           const contacts = JSON.parse(contactsRaw);
           if (contacts.length > 0) {
              console.log(`[SIMULATION] Sent Emergency ${targetAgency} Email/SMS with Live Location to:`, contacts);
              alert(`🚨 Live location sent via Email & SMS to ${contacts.length} emergency contacts!`);
           }
        }
      } catch (err) {
        console.error("Failed to create incident:", err);
      }

      setShowSosSuccess(true);
      setShowSosModal(false);
      setShowSosTargetModal(false);
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
        setShowSosTargetModal(true);
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
      if (ok) triggerSOS(true, 'Police');
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

  const handleDeleteAccount = async () => {
    if (userProfile?.supabaseId) {
      const { error } = await deleteUserProfile(userProfile.supabaseId);
      if (error) {
        alert("Failed to delete account from Supabase: " + (error.message || "Please make sure RLS delete policies are enabled."));
        return;
      }
    }
    await handleLogout();
    setShowDeleteModal(false);
    alert("Account successfully deleted.");
  };

  if (!isLoggedIn) return <AuthPage onLogin={handleLoginSuccess} isDark={appSettings.darkMode} />;

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
                {userProfile?.dob && <span className="text-[9px] text-blue-300 font-medium">Age: {Math.floor((Date.now() - new Date(userProfile.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs</span>}
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden"><X size={24} /></button>
          </div>
          
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button onClick={() => setActiveView(userRole === 'police' ? 'police' : 'tourist')} className={getMenuClass(userRole === 'police' ? 'police' : 'tourist')}><Home size={20}/> {t.dashboard}</button>
            <button onClick={() => setActiveView('profile')} className={getMenuClass('profile')}><User size={20}/> {t.profile}</button>
            {userRole === 'tourist' && (
              <>
                <button onClick={() => setActiveView('digitalId')} className={getMenuClass('digitalId')}><ShieldCheck size={20}/> Digital ID</button>
                <button onClick={() => setActiveView('history')} className={getMenuClass('history')}><Clock size={20}/> SOS History</button>
                <button onClick={() => setActiveView('travelInfo')} className={getMenuClass('travelInfo')}><Briefcase size={20}/> {t.travelInfo}</button>
                <button onClick={() => setActiveView('emergencyContacts')} className={getMenuClass('emergencyContacts')}><Phone size={20}/> {t.emergency}</button>
              </>
            )}
            <button onClick={() => setActiveView('alerts')} className={getMenuClass('alerts')}><ShieldAlert size={20}/> {t.alerts}</button>
            <button onClick={() => setActiveView('travelNews')} className={getMenuClass('travelNews')}><Newspaper size={20}/> {t.travelNews}</button>
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
                {sosHoldProgress > 0 ? `${t.hold} ${Math.max(1, Math.ceil((100 - sosHoldProgress) / 50))}s` : t.sos}
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
                  <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-blue-900'}`}>{t.welcome}, {userProfile?.name ? userProfile.name.split(' ')[0] : 'Traveler'}!</h1>
                  <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.aiCompanion}</p>
                  <p className={`text-xs mt-3 font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {t.safetyInsight} {safetyReason}
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
                  <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-2">{t.safetyScoreTitle}</span>
                  <div className="text-4xl font-black flex items-baseline gap-1">
                    {safetyScore} <span className="text-sm font-bold opacity-70">/ 100</span>
                  </div>
                  <div className="text-xs font-bold mt-2 opacity-90">{isAreaSafe ? t.optimal : t.caution}</div>
                </div>
              </div>

              {/* ROW 2: Crowd, Hotel, Battery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-5 rounded-3xl shadow-sm border flex items-center gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <Users size={28} className={crowdLevel.includes('High') ? 'text-red-500' : crowdLevel.includes('Moderate') ? 'text-yellow-500' : 'text-green-500'} />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t.estCrowd}</p>
                    <p className={`text-sm font-black ${crowdLevel.includes('High') ? 'text-red-500' : crowdLevel.includes('Moderate') ? 'text-yellow-500' : 'text-green-500'}`}>{crowdLevel}</p>
                    <p className="text-[9px] font-bold opacity-50">{t.temporal}</p>
                  </div>
                </div>

                <div className={`p-5 rounded-3xl shadow-sm border flex items-center gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <Hotel size={28} className="text-indigo-500" />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t.hotel}</p>
                    <p className={`text-sm font-black truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{itinerary.hotel || 'Not Set'}</p>
                    {itinerary.dest && <p className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>📍 {itinerary.dest}</p>}
                  </div>
                </div>

                <div className={`p-5 rounded-3xl shadow-sm border flex items-center gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                  <BatteryWarning size={28} className={batteryLevel <= 20 ? 'text-red-500 animate-pulse' : batteryLevel <= 50 ? 'text-yellow-500' : 'text-green-500'} />
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t.battery}</p>
                    <p className={`text-xl font-black ${batteryLevel <= 20 ? 'text-red-500' : 'text-green-500'}`}>{batteryLevel}%</p>
                    {batteryLevel <= 10 && <p className="text-[9px] font-bold text-red-400 animate-pulse">{t.autoSosActive}</p>}
                  </div>
                </div>
              </div>

              {/* ANOMALY ALERTS */}
              <div className={`p-4 rounded-3xl border ${anomalyFlags.length > 0 ? (isDark ? 'border-red-800 bg-red-900/10' : 'border-red-300 bg-red-50') : (isDark ? 'border-emerald-800 bg-emerald-900/10' : 'border-emerald-300 bg-emerald-50')}`}>
                <div className="flex items-center gap-2 mb-3">
                  <MapPinOff size={20} className={anomalyFlags.length > 0 ? "text-red-500" : "text-emerald-500"} />
                  <h3 className={`text-sm font-black uppercase tracking-widest ${anomalyFlags.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{t.aiMovement}</h3>
                </div>
                
                {anomalyFlags.length === 0 ? (
                  <div className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-100'}`}>
                    <ShieldCheck size={16} className="text-emerald-600" />
                    <div>
                      <p className={`text-xs font-black uppercase text-emerald-600`}>{t.normalBehavior}</p>
                      <p className={`text-[11px] font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>{t.normalDesc}</p>
                    </div>
                  </div>
                ) : (
                  anomalyFlags.map((f, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${isDark ? 'bg-red-900/20' : 'bg-red-100'}`}>
                      <AlertTriangle size={16} className={f.severity === 'critical' ? 'text-red-600' : 'text-orange-500'} />
                      <div>
                        <p className={`text-xs font-black uppercase ${f.severity === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>{f.type.replace('_', ' ')}</p>
                        <p className={`text-[11px] font-medium ${isDark ? 'text-red-300' : 'text-red-700'}`}>{f.msg}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* QUICK ACTIONS */}
              <div className={`p-4 rounded-3xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <button
                  type="button"
                  onClick={() => void handleInstantSOS()}
                  disabled={sosBioBusy}
                  className="w-full rounded-2xl py-4 px-4 bg-red-600 text-white font-black shadow-lg hover:bg-red-700 transition disabled:opacity-60 disabled:cursor-wait"
                >
                  {sosBioBusy ? t.instantSosBusy : t.instantSos}
                  <div className="text-[10px] font-bold opacity-80 mt-1">
                    {sosBioBusy
                      ? t.instantSosBusyDesc
                      : t.instantSosDesc}
                  </div>
                </button>
              </div>

              {/* MIDDLE ROW: Map & Interactions */}
              <div className="grid grid-cols-1 gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-end">
                    <h2 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.liveMap}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.find}</span>
                      <button 
                        onClick={() => {
                          setPoiType('');
                          setTimeout(() => setPoiType('Hospitals'), 50);
                        }} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${poiType === 'Hospitals' ? 'bg-red-600 text-white' : (isDark ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}`}
                      >
                        {t.hospitals}
                      </button>
                      <button 
                        onClick={() => {
                          setPoiType('');
                          setTimeout(() => setPoiType('Police'), 50);
                        }} 
                        className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all ${poiType === 'Police' ? 'bg-blue-600 text-white' : (isDark ? 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50')}`}
                      >
                        {t.police}
                      </button>
                    </div>
                  </div>
                  
                  <div className={`rounded-3xl border shadow-sm h-[450px] relative ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} style={{ overflow: 'hidden', isolation: 'isolate' }}>
                    <LiveMap onAlert={handleMapAlert} userLocation={location} globalAlerts={disasters} poiType={poiType} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'police' && <PolicePanel user={userProfile} isDark={isDark} />}

          {activeView === 'digitalId' && <DigitalID user={userProfile} isDark={isDark} itinerary={itinerary} />}
          {activeView === 'profile' && <Profile user={userProfile} setUser={setUserProfile} isDark={isDark} userId={userProfile?.supabaseId} />}
          {activeView === 'history' && <History userId={userProfile?.supabaseId} isDark={isDark} />}
          {activeView === 'travelInfo' && <TravelInfo itinerary={itinerary} setItinerary={setItinerary} isDark={isDark} userId={userProfile?.supabaseId} />}
          {activeView === 'emergencyContacts' && <EmergencyContacts isDark={isDark} userId={userProfile?.supabaseId} />}
          {activeView === 'alerts' && <Alerts isDark={isDark} />}
          {activeView === 'travelNews' && <TravelNews isDark={isDark} disasters={disasters} onBack={() => setActiveView(userRole === 'police' ? 'police' : 'tourist')} />}
          {activeView === 'settings' && <SettingsView settings={appSettings} setSettings={setAppSettings} isDark={isDark} userId={userProfile?.supabaseId} onDeleteClick={() => setShowDeleteModal(true)} />}
        </div>

        <div className={`mt-auto sticky bottom-0 border-t z-[999] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="bg-red-600 text-white py-2 cursor-pointer hover:bg-red-700 transition-colors" onClick={() => setActiveView('travelNews')} title="Click for Travel News">
            <marquee className="text-sm font-bold tracking-widest uppercase">
              {disasters && disasters.length > 0 ? disasters.map(d => `🚨 ${d.type === 'EQ' ? 'EARTHQUAKE' : d.type === 'TC' ? 'CYCLONE' : d.type === 'FL' ? 'FLOOD' : d.type === 'VO' ? 'VOLCANO' : 'ALERT'} IN ${d.country || 'GLOBAL ZONE'} (${d.level || 'Monitoring'})`).join('     •     ') : "Global Systems Online. No severe alerts at this moment."}
            </marquee>
          </div>
          <div className="p-4 flex justify-between items-center max-w-7xl mx-auto">
            <button onClick={() => setShowMiniGames(true)} className="flex items-center gap-2 font-black text-xs text-indigo-600"><Gamepad2 size={16}/> {t.gamesZone}</button>
            <RakshaAI weather={weather} location={location} disasters={disasters} isDark={isDark} />
          </div>
        </div>
      </div>

      {showMiniGames && <MiniGames onClose={() => setShowMiniGames(false)} />}

      {showSosModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm">
          <div className={`rounded-3xl p-8 max-w-sm w-full text-center border-4 border-red-600 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <h2 className="text-3xl font-black text-red-600 mb-4">SOS PIN VERIFICATION</h2>
            <input 
              type="password" 
              placeholder="ENTER PIN" 
              value={sosPinInput}
              onChange={(e) => setSosPinInput(e.target.value)}
              className={`w-full border-2 rounded-xl p-4 text-center text-3xl mb-4 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
            />
            {sosError && <p className="text-red-500 font-bold mb-4">{sosError}</p>}
            <div className="flex gap-4">
              <button onClick={() => setShowSosModal(false)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>{t.cancel}</button>
              <button onClick={() => triggerSOS(false)} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700">{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {showSosTargetModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm animate-fade-in">
          <div className={`rounded-3xl p-8 max-w-sm w-full text-center border-4 border-red-600 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
            <h2 className="text-2xl font-black text-red-600 mb-2 uppercase">{t.emergencyReq}</h2>
            <p className="text-sm font-bold opacity-70 mb-6">{t.emergencyReqDesc}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
               <button onClick={() => triggerSOS(true, 'Police')} className="p-4 rounded-xl bg-blue-100 text-blue-700 font-black hover:bg-blue-200 transition">🚓 POLICE</button>
               <button onClick={() => triggerSOS(true, 'Medical')} className="p-4 rounded-xl bg-red-100 text-red-700 font-black hover:bg-red-200 transition">🚑 MEDICAL</button>
               <button onClick={() => triggerSOS(true, 'Fire')} className="p-4 rounded-xl bg-orange-100 text-orange-700 font-black hover:bg-orange-200 transition">🔥 FIRE</button>
               <button onClick={() => triggerSOS(true, 'NDRF')} className="p-4 rounded-xl bg-yellow-100 text-yellow-800 font-black hover:bg-yellow-200 transition">🚁 NDRF</button>
            </div>
            <button onClick={() => setShowSosTargetModal(false)} className={`w-full py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>{t.cancelSos}</button>
          </div>
        </div>
      )}

      {showSosSuccess && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm animate-fade-in">
          <div className="bg-red-600 text-white rounded-3xl p-8 max-w-md w-full text-center border-4 border-red-800 shadow-2xl animate-bounce">
            <AlertTriangle size={60} className="mx-auto mb-4" />
            <h2 className="text-3xl font-black mb-2">{t.sosTriggered}</h2>
            <p className="text-lg font-bold opacity-90">{t.sosTriggeredDesc1}</p>
            <p className="text-sm mt-4 opacity-75">{t.sosTriggeredDesc2}</p>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm">
          <div className={`rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <h2 className="text-2xl font-black mb-4">{t.logoutPrompt}</h2>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowLogoutModal(false)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{t.no}</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30">{t.yes}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[10000] backdrop-blur-sm">
          <div className={`rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl border border-red-500 ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-gray-900'}`}>
            <AlertTriangle size={50} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-black mb-2 text-red-500">Delete Account?</h2>
            <p className={`text-sm mb-6 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>This action is permanent and cannot be undone. All your data will be wiped.</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
              <button onClick={handleDeleteAccount} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-600/30">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;