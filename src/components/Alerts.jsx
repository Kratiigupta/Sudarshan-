import React, { useState } from 'react';
import { CloudRain, MapPin, Bot, AlertTriangle, Construction, Tent, Phone, BellRing, Wind, Droplets, Navigation, Info, Clock, ShieldAlert, Globe } from 'lucide-react';

const Alerts = ({ isDark, disasters = [] }) => {
  const [activeTab, setActiveTab] = useState('alerts'); 

  // Mapping GDACS disasters to My AI Alerts
  const aiAlerts = disasters.slice(0, 8).map(d => ({
    id: d.id,
    dept: "GLOBAL SYSTEM",
    title: d.type,
    desc: `${d.name} in ${d.country}. Alert Level: ${d.level}. Stay updated on local safety protocols.`,
    time: (() => { try { const dD = new Date(d.date); return !isNaN(dD.getTime()) ? dD.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'; } catch { return 'Recently'; } })(),
    color: d.level === 'Red' ? 'red' : (d.level === 'Orange' ? 'yellow' : 'blue'),
    icon: AlertTriangle
  }));

  // Mapping GDACS disasters to Global News
  const newsAlerts = disasters.map(d => ({
    id: d.id,
    type: d.level === 'Red' ? 'critical' : (d.level === 'Orange' ? 'warning' : 'info'),
    icon: Globe,
    title: `${d.type}: ${d.name}`,
    desc: `Reported in ${d.country}. Level: ${d.level}. GDACS systems monitoring live geo-spatial data.`,
    time: (() => { try { const dD = new Date(d.date); return !isNaN(dD.getTime()) ? dD.toLocaleDateString() : 'Recent'; } catch { return 'Recent'; } })(),
  }));

  const getBorderColor = (color) => {
    if (color === 'red') return 'border-l-red-500';
    if (color === 'yellow') return 'border-l-yellow-500';
    if (color === 'blue') return 'border-l-blue-500';
    return 'border-l-indigo-500';
  };

  const getBgColor = (color) => {
    if (isDark) {
      if (color === 'red') return 'bg-red-900/30 text-red-400';
      if (color === 'yellow') return 'bg-yellow-900/30 text-yellow-400';
      if (color === 'blue') return 'bg-blue-900/30 text-blue-400';
      return 'bg-indigo-900/30 text-indigo-400';
    }
    if (color === 'red') return 'bg-red-100 text-red-700';
    if (color === 'yellow') return 'bg-yellow-100 text-yellow-700';
    if (color === 'blue') return 'bg-blue-100 text-blue-700';
    return 'bg-indigo-100 text-indigo-700';
  };

  const getNewsColor = (type) => {
    if (isDark) {
      if (type === 'critical') return 'bg-red-900/20 border-red-800 text-red-400';
      if (type === 'warning') return 'bg-orange-900/20 border-orange-800 text-orange-400';
      if (type === 'safe') return 'bg-green-900/20 border-green-800 text-green-400';
      return 'bg-blue-900/20 border-blue-800 text-blue-400';
    }
    if (type === 'critical') return 'bg-red-50 border-red-200 text-red-700';
    if (type === 'warning') return 'bg-orange-50 border-orange-200 text-orange-700';
    if (type === 'safe') return 'bg-green-50 border-green-200 text-green-700';
    return 'bg-blue-50 border-blue-200 text-blue-700';
  };

  const getNewsIconColor = (type) => {
    if (type === 'critical') return 'text-red-600';
    if (type === 'warning') return 'text-orange-500';
    if (type === 'safe') return 'text-green-500';
    return 'text-blue-500';
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in relative pb-10">
      
      <div className={`p-6 rounded-3xl shadow-sm border mb-8 flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-transparent'}`}>
        <div className="flex items-center gap-4">
          <Globe size={40} className="text-blue-300 opacity-80" />
          <div>
            <h2 className="text-2xl font-black tracking-widest uppercase">Global Safety Alerts</h2>
            <p className="font-medium text-blue-200 text-sm">Powered by GDACS Real-Time Live Feed</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onRefresh && onRefresh()} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10 shadow-sm">
            Refresh
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <span className="font-bold text-xs tracking-widest text-red-200 uppercase">Live Updates</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {disasters && disasters.length > 0 ? disasters.map((d, idx) => (
          <div key={`alert-${idx}`} className={`p-6 rounded-3xl border-l-8 shadow-sm transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} ${getBorderColor(d.level === 'Red' ? 'red' : d.level === 'Orange' ? 'yellow' : 'blue')}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase ${getBgColor(d.level === 'Red' ? 'red' : d.level === 'Orange' ? 'yellow' : 'blue')}`}>
                  {d.type || 'Alert'}
                </span>
                <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                  Level: {d.level || 'Unknown'}
                </span>
              </div>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-gray-500'} flex items-center gap-1`}>
                <Clock size={14}/> 
                {(() => { try { const dD = new Date(d.date); return !isNaN(dD.getTime()) ? dD.toLocaleString() : 'Recent'; } catch { return 'Recent'; } })()}
              </span>
            </div>
            
            <div className="flex gap-4 items-start">
              <div className={`p-4 rounded-2xl flex-shrink-0 ${getBgColor(d.level === 'Red' ? 'red' : d.level === 'Orange' ? 'yellow' : 'blue')}`}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{d.name || 'Safety Incident'}</h3>
                <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Reported in <strong className="uppercase">{d.country || 'Unknown Region'}</strong>. Please exercise caution if traveling to or currently in this area. Monitor local news for evacuation or safety protocols.
                </p>
                <div className="mt-4 flex gap-3">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded border ${isDark ? 'border-slate-600 text-slate-400' : 'border-gray-200 text-gray-500'} flex items-center gap-1`}><MapPin size={12}/> Lat: {parseFloat(d.lat || 0).toFixed(2)}, Lon: {parseFloat(d.lon || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300 dark:bg-slate-800 dark:border-slate-700">
            <Globe size={60} className="mx-auto text-blue-500 opacity-20 mb-4 animate-spin-slow" />
            <p className="text-xl font-bold text-gray-500 dark:text-slate-400">Connecting to global disaster network...</p>
            <p className="text-sm font-medium text-gray-400 mt-2">Waiting for GDACS live feed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;