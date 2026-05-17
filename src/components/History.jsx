import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, CheckCircle2, MapPin, Calendar, RefreshCcw, Activity } from 'lucide-react';
import { getUserIncidents } from '../supabase';

const History = ({ userId, isDark }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await getUserIncidents(userId);
    setIncidents(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'text-emerald-500';
      case 'investigating': return 'text-blue-500';
      default: return 'text-orange-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className={`p-6 rounded-3xl shadow-sm border flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <Clock size={28} />
          </div>
          <div>
            <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>SOS History</h2>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>View your past emergency reports and their resolution status.</p>
          </div>
        </div>
        <button 
          onClick={fetchHistory} 
          className={`p-3 rounded-xl border transition hover:scale-105 ${isDark ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
        >
          <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <RefreshCcw className="animate-spin mb-4" size={40} />
            <p className="font-bold uppercase tracking-widest text-sm">Retrieving Secure Records...</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className={`p-12 rounded-3xl border border-dashed text-center ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
            <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500 opacity-50" />
            <h3 className={`text-lg font-bold ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>No Incidents Reported</h3>
            <p className="text-sm opacity-60">Your safety record is clean. No past SOS triggers found.</p>
          </div>
        ) : (
          incidents.map((inc) => (
            <div 
              key={inc.id} 
              className={`p-6 rounded-3xl border shadow-sm transition-all hover:translate-x-2 ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700/50' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg border font-black text-[10px] uppercase ${getSeverityColor(inc.severity)}`}>
                    {inc.severity}
                  </div>
                  <h4 className="font-black text-lg tracking-tight">{inc.type.toUpperCase()}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold opacity-60">{new Date(inc.created_at).toLocaleDateString()}</p>
                  <p className="text-[10px] font-mono opacity-40">#{inc.id.slice(0,8).toUpperCase()}</p>
                </div>
              </div>

              <p className="text-sm opacity-80 mb-6 leading-relaxed">{inc.description || 'Emergency SOS triggered.'}</p>

              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2 opacity-70">
                  <MapPin size={14} className="text-blue-500" />
                  <span className="text-xs font-bold truncate">{inc.address || `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`}</span>
                </div>
                <div className="flex items-center gap-2 opacity-70">
                  <Activity size={14} className="text-blue-500" />
                  <span className={`text-xs font-black uppercase ${getStatusColor(inc.status)}`}>{inc.status}</span>
                </div>
                <div className="flex items-center gap-2 opacity-70">
                  <ShieldAlert size={14} className="text-blue-500" />
                  <span className="text-xs font-bold truncate">Sector: {inc.station || 'General HQ'}</span>
                </div>
              </div>

              {inc.assigned_officer_name && (
                <div className="mt-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <CheckCircle2 size={14} className="text-blue-500" />
                     <span className="text-[10px] font-black uppercase text-blue-600">Officer Assigned: {inc.assigned_officer_name}</span>
                  </div>
                  {inc.fir_id && <span className="text-[9px] font-mono bg-blue-600 text-white px-2 py-0.5 rounded-full">E-FIR: {inc.fir_id}</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default History;
