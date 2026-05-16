import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Map as MapIcon, 
  Bell, 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  MapPin, 
  Plus, 
  X,
  RefreshCcw,
  Activity,
  Zap
} from 'lucide-react';
import { 
  getIncidents, 
  updateIncident, 
  subscribeToIncidents, 
  getHotspots, 
  createHotspot, 
  deleteHotspot,
  createAlert 
} from '../supabase';
import LiveMap from './LiveMap';

const PolicePanel = ({ user, isDark }) => {
  const [incidents, setIncidents] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [view, setView] = useState('list'); // 'list' or 'map'
  const [filter, setFilter] = useState('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, critical: 0 });

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    const { data: incidentData } = await getIncidents(50);
    const { data: hotspotData } = await getHotspots();
    
    setIncidents(incidentData || []);
    setHotspots(hotspotData || []);
    calculateStats(incidentData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Subscribe to real-time updates
    const subscription = subscribeToIncidents((payload) => {
      if (payload.eventType === 'INSERT') {
        setIncidents(prev => [payload.new, ...prev]);
        // Play alert sound if critical
        if (payload.new.severity === 'critical') {
           new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3').play().catch(e => {});
        }
      } else if (payload.eventType === 'UPDATE') {
        setIncidents(prev => prev.map(inc => inc.id === payload.new.id ? payload.new : inc));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const calculateStats = (data) => {
    const s = {
      total: data.length,
      pending: data.filter(i => i.status === 'open' || i.status === 'investigating').length,
      resolved: data.filter(i => i.status === 'resolved').length,
      critical: data.filter(i => i.severity === 'critical').length
    };
    setStats(s);
  };

  useEffect(() => {
    calculateStats(incidents);
  }, [incidents]);

  const handleStatusUpdate = async (id, newStatus) => {
    const { error } = await updateIncident(id, { status: newStatus });
    if (error) alert("Failed to update status: " + error.message);
  };

  const handleAssignOfficer = async (id) => {
    const officerName = prompt("Enter Officer Name/ID:");
    if (officerName) {
      const { error } = await updateIncident(id, { assigned_officer_name: officerName, status: 'investigating' });
      if (error) alert("Failed to assign officer: " + error.message);
    }
  };

  const handleAddFir = async (id) => {
    const firId = prompt("Enter E-FIR ID:");
    if (firId) {
      const { error } = await updateIncident(id, { fir_id: firId });
      if (error) alert("Failed to add FIR: " + error.message);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filter === 'all') return true;
    if (filter === 'pending') return inc.status === 'open' || inc.status === 'investigating';
    if (filter === 'resolved') return inc.status === 'resolved';
    if (filter === 'critical') return inc.severity === 'critical' || inc.severity === 'high';
    return true;
  });

  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      default: return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
    }
  };

  return (
    <div className={`flex flex-col gap-6 h-full max-w-7xl mx-auto animate-fade-in`}>
      {/* HEADER / STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Incidents" value={stats.total} icon={<Activity className="text-blue-500" />} color="blue" isDark={isDark} />
        <StatCard title="Active Cases" value={stats.pending} icon={<Clock className="text-orange-500" />} color="orange" isDark={isDark} />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-emerald-500" />} color="emerald" isDark={isDark} />
        <StatCard title="Critical Alerts" value={stats.critical} icon={<AlertCircle className="text-red-500" />} color="red" isDark={isDark} />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 h-[700px]">
        {/* LEFT COLUMN: INCIDENT LIST */}
        <div className={`flex-1 flex flex-col rounded-3xl border overflow-hidden shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-inherit z-10">
            <div className="flex items-center gap-3">
              <Shield className="text-blue-600" size={24} />
              <div>
                <h2 className="font-black text-lg tracking-tight uppercase leading-none">Live Incident Response</h2>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Sector: {user?.station || 'General HQ'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)}
                className={`text-xs font-bold p-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}
              >
                <option value="all">GLOBAL FEED</option>
                <option value="pending">PENDING</option>
                <option value="resolved">RESOLVED</option>
                <option value="critical">CRITICAL</option>
              </select>
              <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                 <button onClick={() => setView('list')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${view === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'opacity-50 hover:opacity-100'}`}>LIST</button>
                 <button onClick={() => setView('map')} className={`px-3 py-1 text-xs font-bold rounded-md transition ${view === 'map' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'opacity-50 hover:opacity-100'}`}>MAP</button>
              </div>
              <button onClick={fetchData} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition">
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>

          {view === 'list' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <RefreshCcw className="animate-spin mb-2" size={32} />
                  <p className="text-xs font-bold uppercase tracking-widest">Scanning Grid...</p>
                </div>
              ) : filteredIncidents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-50 text-center p-8">
                  <CheckCircle2 size={48} className="mb-4 text-emerald-500" />
                  <h3 className="font-bold">GRID IS CLEAR</h3>
                  <p className="text-xs">No active incidents reported in this sector.</p>
                </div>
              ) : (
                filteredIncidents.map((inc) => (
                  <div 
                    key={inc.id} 
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-4 border-b cursor-pointer transition-all hover:pl-6 relative group ${selectedIncident?.id === inc.id ? (isDark ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : 'bg-blue-50 border-l-4 border-l-blue-600') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50')}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono text-blue-500 font-black tracking-tighter">
                        #{inc.id.slice(0, 8).toUpperCase()} • {new Date(inc.created_at).toLocaleTimeString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${getSeverityColor(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{inc.type.toUpperCase()}</h4>
                    <p className="text-xs opacity-70 line-clamp-2 mb-2">{inc.description || 'No description provided.'}</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold opacity-60">
                      <span className="flex items-center gap-1"><MapPin size={12}/> {inc.address || 'Unknown Loc'}</span>
                      <span className="flex items-center gap-1 font-black text-blue-600 uppercase tracking-tighter">[{inc.station || 'GENERAL'}]</span>
                      <span className={`flex items-center gap-1 ${inc.status === 'resolved' ? 'text-emerald-500' : 'text-orange-500'}`}>
                        <Activity size={12}/> {inc.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex-1 relative flex flex-col">
              <div className={`p-2 border-b flex gap-2 justify-center z-20 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                 <button 
                   onClick={() => setShowHeatmap(!showHeatmap)} 
                   className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${showHeatmap ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30' : (isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white hover:bg-gray-50')}`}
                 >
                    🔥 Risk Heatmap
                 </button>
                 <button 
                   onClick={() => setShowClusters(!showClusters)} 
                   className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${showClusters ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30' : (isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white hover:bg-gray-50')}`}
                 >
                    👥 Tourist Clusters
                 </button>
              </div>
              <div className="flex-1 z-10">
                 <LiveMap 
                    viewMode="police" 
                    incidents={incidents}
                    hotspots={hotspots}
                    showHeatmap={showHeatmap}
                    showClusters={showClusters}
                 />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILS & ACTIONS */}
        <div className={`w-full xl:w-[450px] flex flex-col rounded-3xl border overflow-hidden shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          {selectedIncident ? (
            <div className="flex flex-col h-full animate-slide-in">
              <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
                <h3 className="font-black uppercase tracking-tighter text-sm">Incident Management</h3>
                <button onClick={() => setSelectedIncident(null)}><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Geographical Data</h4>
                  <div className="h-40 rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 relative">
                     {/* Mini Map Preview */}
                     <LiveMap 
                        userLocation={{ lat: selectedIncident.latitude, lon: selectedIncident.longitude }} 
                        viewMode="police"
                        zoom={16}
                     />
                     <div className="absolute inset-0 pointer-events-none border-4 border-red-500/30"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-[9px] font-bold opacity-50 uppercase mb-1">Status</p>
                      <p className="font-black text-sm uppercase text-blue-500">{selectedIncident.status}</p>
                   </div>
                   <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-[9px] font-bold opacity-50 uppercase mb-1">Officer</p>
                      <p className="font-black text-sm uppercase truncate">{selectedIncident.assigned_officer_name || 'UNASSIGNED'}</p>
                   </div>
                </div>

                <div>
                   <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Reporter Details</h4>
                   <p className="text-sm font-bold">{selectedIncident.reporter_name || 'Anonymous User'}</p>
                   <p className="text-xs opacity-60">ID: {selectedIncident.user_id || 'N/A'}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Execution Actions</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedIncident.status !== 'resolved' && (
                      <>
                        <button 
                          onClick={() => handleAssignOfficer(selectedIncident.id)}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 transition"
                        >
                          <span className="flex items-center gap-2"><Users size={16}/> DEPLOY OFFICER</span>
                          <Zap size={14} />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(selectedIncident.id, 'resolved')}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition"
                        >
                          <span className="flex items-center gap-2"><CheckCircle2 size={16}/> MARK RESOLVED</span>
                          <CheckCircle2 size={14} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleAddFir(selectedIncident.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border font-black text-xs transition ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                    >
                      <span className="flex items-center gap-2"><Shield size={16}/> {selectedIncident.fir_id ? 'UPDATE FIR' : 'GENERATE E-FIR'}</span>
                      {selectedIncident.fir_id && <span className="text-[8px] bg-blue-100 text-blue-700 px-1 rounded">{selectedIncident.fir_id}</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-40">
              <Shield size={64} className="mb-4" />
              <h3 className="font-black uppercase">Command Interface</h3>
              <p className="text-xs">Select an incident from the grid to access tactical options.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, isDark }) => {
  const colors = {
    blue: 'border-blue-500/50 bg-blue-500/5',
    orange: 'border-orange-500/50 bg-orange-500/5',
    emerald: 'border-emerald-500/50 bg-emerald-500/5',
    red: 'border-red-500/50 bg-red-500/5',
  };

  return (
    <div className={`p-5 rounded-3xl border-2 flex items-center gap-4 shadow-sm transition-all hover:scale-[1.02] ${colors[color]} ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className={`p-3 rounded-2xl bg-white dark:bg-slate-800 shadow-inner`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{title}</p>
        <p className="text-3xl font-black">{value}</p>
      </div>
    </div>
  );
};

export default PolicePanel;
