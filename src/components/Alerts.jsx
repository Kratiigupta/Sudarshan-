import React, { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, Clock, RefreshCcw, AlertTriangle, Activity, Navigation, Globe } from 'lucide-react';
import { getIncidents } from '../supabase';

const Alerts = ({ isDark }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'high'

  const fetchIncidents = async () => {
    setLoading(true);
    const { data } = await getIncidents(30); // Fetch recent 30 incidents from all over India
    setIncidents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'border-l-red-500 bg-red-500/5';
      case 'high': return 'border-l-orange-500 bg-orange-500/5';
      case 'medium': return 'border-l-yellow-500 bg-yellow-500/5';
      default: return 'border-l-blue-500 bg-blue-500/5';
    }
  };

  const getTagColor = (sev) => {
    if (isDark) {
      if (sev === 'critical') return 'bg-red-900/30 text-red-400';
      if (sev === 'high') return 'bg-orange-900/30 text-orange-400';
      return 'bg-blue-900/30 text-blue-400';
    }
    if (sev === 'critical') return 'bg-red-100 text-red-700';
    if (sev === 'high') return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      
      <div className={`p-6 rounded-3xl shadow-sm border flex justify-between items-center flex-wrap gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent'}`}>
        <div className="flex items-center gap-4">
          <ShieldAlert size={40} className="text-white opacity-80" />
          <div>
            <h2 className="text-2xl font-black tracking-widest uppercase">Safety & Incident Alerts</h2>
            <p className="font-medium text-red-100 text-sm">Real-time reports from across India & Local Sectors</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={fetchIncidents} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10 shadow-sm">
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 opacity-50">
             <Activity className="animate-pulse mx-auto mb-4" size={48} />
             <p className="font-bold uppercase tracking-widest">Scanning National Safety Grid...</p>
          </div>
        ) : incidents.length > 0 ? (
          incidents.map((inc) => (
            <div 
              key={inc.id} 
              className={`p-6 rounded-3xl border-l-8 shadow-sm transition-all hover:scale-[1.01] ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'} ${getSeverityColor(inc.severity)}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-widest uppercase ${getTagColor(inc.severity)}`}>
                    {inc.type || 'Alert'}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest opacity-60 flex items-center gap-1`}>
                    <MapPin size={12} /> {inc.station || 'PAN INDIA'}
                  </span>
                </div>
                <span className={`text-[10px] font-bold opacity-50 flex items-center gap-1`}>
                  <Clock size={12}/> {new Date(inc.created_at).toLocaleString()}
                </span>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <h3 className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{inc.type === 'SOS' ? '🚨 EMERGENCY SOS' : inc.type.toUpperCase()}</h3>
                  <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    {inc.description || 'No description available for this incident.'}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${isDark ? 'border-slate-700 text-slate-400' : 'border-gray-200 text-gray-500'} flex items-center gap-1`}>
                      <Navigation size={12}/> {inc.address || 'Location Hidden for Privacy'}
                    </span>
                    <span className={`text-[10px] font-black uppercase ${inc.status === 'resolved' ? 'text-green-500' : 'text-orange-500'}`}>
                      • {inc.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-300 dark:bg-slate-800 dark:border-slate-700">
            <Globe size={60} className="mx-auto text-blue-500 opacity-20 mb-4" />
            <p className="text-xl font-bold text-gray-500 dark:text-slate-400">No active incidents found.</p>
            <p className="text-sm font-medium text-gray-400 mt-2">All systems clear. Stay safe!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;