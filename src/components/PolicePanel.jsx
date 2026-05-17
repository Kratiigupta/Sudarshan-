import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Bell,
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
  
  // Management State
  const [mgmtTab, setMgmtTab] = useState('incidents'); // 'incidents', 'hotspots', 'alerts'
  const [newHotspot, setNewHotspot] = useState({ lat: '', lon: '', radius: 500, type: 'danger', desc: '' });
  const [newAlert, setNewAlert] = useState({ title: '', desc: '', type: 'weather', severity: 'medium' });
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    const { data: incidentData } = await getIncidents(100);
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
      critical: data.filter(i => i.severity === 'critical' || i.severity === 'high').length
    };
    setStats(s);
  };

  useEffect(() => {
    calculateStats(incidents);
  }, [incidents]);

  const handleStatusUpdate = async (id, newStatus) => {
    setIsActionLoading(true);
    const { error } = await updateIncident(id, { status: newStatus });
    if (error) alert("Failed to update status: " + error.message);
    setIsActionLoading(false);
  };

  const handleAssignOfficer = async (id) => {
    const officerName = prompt("Enter Officer Name/ID:");
    if (officerName) {
      setIsActionLoading(true);
      const { error } = await updateIncident(id, { assigned_officer_name: officerName, status: 'investigating' });
      if (error) alert("Failed to assign officer: " + error.message);
      setIsActionLoading(false);
    }
  };

  const handleAddFir = async (id) => {
    const firId = prompt("Enter E-FIR ID:");
    if (firId) {
      setIsActionLoading(true);
      const { error } = await updateIncident(id, { fir_id: firId });
      if (error) alert("Failed to add FIR: " + error.message);
      setIsActionLoading(false);
    }
  };

  const handleCreateHotspot = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    const { data, error } = await createHotspot({
      latitude: parseFloat(newHotspot.lat),
      longitude: parseFloat(newHotspot.lon),
      radius_meters: parseInt(newHotspot.radius),
      type: newHotspot.type,
      description: newHotspot.desc
    });
    if (!error) {
      alert("✅ Hotspot Created Successfully!");
      setHotspots([data, ...hotspots]);
      setNewHotspot({ lat: '', lon: '', radius: 500, type: 'danger', desc: '' });
    } else {
      alert("Error: " + error.message);
    }
    setIsActionLoading(false);
  };

  const handleBroadcastAlert = async (e) => {
    e.preventDefault();
    setIsActionLoading(true);
    const { error } = await createAlert({
      title: newAlert.title,
      description: newAlert.desc,
      type: newAlert.type,
      severity: newAlert.severity,
      area: user?.station || 'GLOBAL'
    });
    if (!error) {
      alert("📢 Alert Broadcasted to all Users!");
      setNewAlert({ title: '', desc: '', type: 'weather', severity: 'medium' });
    } else {
      alert("Error: " + error.message);
    }
    setIsActionLoading(false);
  };

  const handleDeleteHotspot = async (id) => {
    if (!confirm("Remove this danger zone from the map?")) return;
    const { error } = await deleteHotspot(id);
    if (!error) setHotspots(hotspots.filter(h => h.id !== id));
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
    <div className={`flex flex-col gap-6 h-full max-w-7xl mx-auto animate-fade-in relative`}>
      {loading && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/40 backdrop-blur-md rounded-3xl">
           <RefreshCcw className="animate-spin text-white mb-4" size={64} />
           <p className="text-white font-black uppercase tracking-[0.3em] text-xl animate-pulse">Establishing Tactical Link...</p>
        </div>
      )}

      {/* HEADER / STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Incidents" value={stats.total} icon={<Activity className="text-blue-500" />} color="blue" isDark={isDark} />
        <StatCard title="Active Cases" value={stats.pending} icon={<Clock className="text-orange-500" />} color="orange" isDark={isDark} />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle2 className="text-emerald-500" />} color="emerald" isDark={isDark} />
        <StatCard title="Critical Alerts" value={stats.critical} icon={<AlertCircle className="text-red-500" />} color="red" isDark={isDark} />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 h-[700px]">
        {/* LEFT COLUMN: NAVIGATION & FEED */}
        <div className={`flex-1 flex flex-col rounded-3xl border overflow-hidden shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-inherit z-10">
            <div className="flex items-center gap-3">
              <Shield className="text-blue-600" size={24} />
              <div>
                <h2 className="font-black text-lg tracking-tight uppercase leading-none">Tactical Command</h2>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Sector: {user?.station || 'General HQ'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex rounded-lg p-1 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                 <button onClick={() => setMgmtTab('incidents')} className={`px-4 py-1.5 text-xs font-black rounded-md transition ${mgmtTab === 'incidents' ? 'bg-blue-600 text-white shadow-lg' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}>INCIDENTS</button>
                 <button onClick={() => setMgmtTab('hotspots')} className={`px-4 py-1.5 text-xs font-black rounded-md transition ${mgmtTab === 'hotspots' ? 'bg-blue-600 text-white shadow-lg' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}>DANGER ZONES</button>
                 <button onClick={() => setMgmtTab('alerts')} className={`px-4 py-1.5 text-xs font-black rounded-md transition ${mgmtTab === 'alerts' ? 'bg-blue-600 text-white shadow-lg' : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}>BROADCAST</button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {mgmtTab === 'incidents' && (
              <div className="flex flex-col h-full">
                <div className={`p-2 px-4 border-b flex items-center justify-between ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                   <div className={`flex rounded-lg p-1 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <button onClick={() => setView('list')} className={`px-3 py-1 text-[10px] font-black rounded-md transition ${view === 'list' ? (isDark ? 'bg-blue-900/40 text-blue-400 shadow-sm' : 'bg-blue-100 text-blue-600 shadow-sm') : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}>LIST VIEW</button>
                      <button onClick={() => setView('map')} className={`px-3 py-1 text-[10px] font-black rounded-md transition ${view === 'map' ? (isDark ? 'bg-blue-900/40 text-blue-400 shadow-sm' : 'bg-blue-100 text-blue-600 shadow-sm') : (isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900')}`}>GRID MAP</button>
                   </div>
                   <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-[10px] font-black p-1.5 rounded bg-transparent border-none outline-none text-blue-600"
                  >
                    <option value="all">ALL FEEDS</option>
                    <option value="pending">PENDING</option>
                    <option value="resolved">RESOLVED</option>
                    <option value="critical">CRITICAL</option>
                  </select>
                </div>
                
                {view === 'list' ? (
                  <div className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-gray-100'}`}>
                    {filteredIncidents.length === 0 ? (
                      <div className="text-center py-20 opacity-30">No incidents to display</div>
                    ) : (
                      filteredIncidents.map((inc) => (
                        <div 
                          key={inc.id} 
                          onClick={() => setSelectedIncident(inc)}
                          className={`p-4 cursor-pointer transition-all hover:pl-6 relative group ${selectedIncident?.id === inc.id ? (isDark ? 'bg-blue-900/20 border-l-4 border-l-blue-500' : 'bg-blue-50 border-l-4 border-l-blue-600') : (isDark ? 'hover:bg-slate-800/50' : 'hover:bg-gray-50')}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono text-blue-500 font-black tracking-tighter uppercase">
                              #{inc.id.slice(0, 8)} • {new Date(inc.created_at).toLocaleTimeString()}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${getSeverityColor(inc.severity)}`}>
                              {inc.severity}
                            </span>
                          </div>
                          <h4 className="font-black text-sm mb-1 uppercase tracking-tight">{inc.type}</h4>
                          <p className="text-xs opacity-70 line-clamp-2 mb-2">{inc.description || 'No detailed intel available.'}</p>
                          <div className="flex items-center gap-4 text-[9px] font-black opacity-60 uppercase">
                            <span className="flex items-center gap-1"><MapPin size={10}/> {inc.address || 'Unknown'}</span>
                            <span className="text-blue-600">[{inc.station || 'GLOBAL'}]</span>
                            <span className={`${inc.status === 'resolved' ? 'text-emerald-500' : 'text-orange-500'}`}>{inc.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="flex-1 relative">
                    <LiveMap 
                        viewMode="police" 
                        incidents={incidents}
                        hotspots={hotspots}
                        showHeatmap={true}
                        showClusters={true}
                    />
                  </div>
                )}
              </div>
            )}

            {mgmtTab === 'hotspots' && (
              <div className="p-6 space-y-6">
                <form onSubmit={handleCreateHotspot} className={`p-4 rounded-2xl border-2 border-dashed ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                   <h3 className="font-black text-xs uppercase mb-4 flex items-center gap-2"><Zap size={14} className="text-orange-500"/> Define Danger Zone</h3>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <input type="text" placeholder="LATITUDE" value={newHotspot.lat} onChange={e => setNewHotspot({...newHotspot, lat: e.target.value})} required className={`p-2.5 rounded-xl border text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                      <input type="text" placeholder="LONGITUDE" value={newHotspot.lon} onChange={e => setNewHotspot({...newHotspot, lon: e.target.value})} required className={`p-2.5 rounded-xl border text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                   </div>
                   <div className="grid grid-cols-2 gap-4 mb-4">
                      <select value={newHotspot.type} onChange={e => setNewHotspot({...newHotspot, type: e.target.value})} className={`p-2.5 rounded-xl border text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                         <option value="danger">CRIME HOTSPOT</option>
                         <option value="accident">ACCIDENT PRONE</option>
                         <option value="protest">PROTEST ZONE</option>
                         <option value="disaster">NATURAL DISASTER</option>
                      </select>
                      <input type="number" placeholder="RADIUS (meters)" value={newHotspot.radius} onChange={e => setNewHotspot({...newHotspot, radius: e.target.value})} required className={`p-2.5 rounded-xl border text-xs font-bold ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                   </div>
                   <input type="text" placeholder="REASON / DESCRIPTION" value={newHotspot.desc} onChange={e => setNewHotspot({...newHotspot, desc: e.target.value})} required className={`w-full p-2.5 rounded-xl border text-xs font-bold mb-4 ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                   <button type="submit" disabled={isActionLoading} className="w-full py-3 bg-orange-600 text-white font-black text-xs rounded-xl hover:bg-orange-700 transition">DEPLOY HOTSPOT TO GRID</button>
                </form>

                <div className="space-y-3">
                   <h3 className="font-black text-xs uppercase opacity-50">Active Danger Zones ({hotspots.length})</h3>
                   {hotspots.map(h => (
                     <div key={h.id} className={`p-4 rounded-2xl border flex items-center justify-between ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.type === 'danger' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                              <AlertCircle size={20} />
                           </div>
                           <div>
                              <p className="font-black text-xs uppercase tracking-tight">{h.type.toUpperCase()} • {h.radius_meters}M</p>
                              <p className="text-[10px] opacity-70 font-bold">{h.description}</p>
                           </div>
                        </div>
                        <button onClick={() => handleDeleteHotspot(h.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition"><X size={18}/></button>
                     </div>
                   ))}
                </div>
              </div>
            )}

            {mgmtTab === 'alerts' && (
              <div className="p-6">
                 <form onSubmit={handleBroadcastAlert} className={`p-6 rounded-3xl border-2 ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-center gap-3 mb-6">
                       <Bell className="text-blue-600 animate-bounce" size={32} />
                       <div>
                          <h3 className="font-black text-lg uppercase tracking-tighter">Emergency Broadcast</h3>
                          <p className="text-xs font-bold opacity-60">Message will be pushed to all tourist devices instantly.</p>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                       <input type="text" placeholder="ALERT TITLE (e.g. Heavy Rain Alert)" value={newAlert.title} onChange={e => setNewAlert({...newAlert, title: e.target.value})} required className={`w-full p-4 rounded-2xl border focus:ring-4 focus:ring-blue-500/20 outline-none font-black text-sm uppercase ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`} />
                       <textarea rows="4" placeholder="DETAILED INSTRUCTIONS..." value={newAlert.desc} onChange={e => setNewAlert({...newAlert, desc: e.target.value})} required className={`w-full p-4 rounded-2xl border focus:ring-4 focus:ring-blue-500/20 outline-none font-bold text-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}></textarea>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <select value={newAlert.type} onChange={e => setNewAlert({...newAlert, type: e.target.value})} className={`p-4 rounded-2xl border font-black text-xs uppercase ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                             <option value="weather">WEATHER ALERT</option>
                             <option value="crime">SECURITY ALERT</option>
                             <option value="traffic">TRAFFIC BLOCKED</option>
                             <option value="general">GENERAL INFO</option>
                          </select>
                          <select value={newAlert.severity} onChange={e => setNewAlert({...newAlert, severity: e.target.value})} className={`p-4 rounded-2xl border font-black text-xs uppercase ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
                             <option value="low">LOW SEVERITY</option>
                             <option value="medium">MEDIUM SEVERITY</option>
                             <option value="high">HIGH SEVERITY</option>
                             <option value="critical">CRITICAL / SOS</option>
                          </select>
                       </div>

                       <button type="submit" disabled={isActionLoading} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/30 hover:bg-blue-700 transition flex items-center justify-center gap-3">
                          {isActionLoading ? <RefreshCcw size={20} className="animate-spin"/> : <Zap size={20}/>} 
                          {isActionLoading ? 'SENDING...' : 'BROADCAST ALERT NOW'}
                       </button>
                    </div>
                 </form>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TACTICAL HUD */}
        <div className={`w-full xl:w-[450px] flex flex-col rounded-3xl border overflow-hidden shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          {selectedIncident ? (
            <div className="flex flex-col h-full animate-slide-in">
              <div className="p-4 border-b flex justify-between items-center bg-blue-600 text-white">
                <h3 className="font-black uppercase tracking-tighter text-sm">Target Management</h3>
                <button onClick={() => setSelectedIncident(null)}><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Live GPS Target</h4>
                  <div className={`h-44 rounded-2xl overflow-hidden border relative ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                     <LiveMap 
                        userLocation={{ lat: selectedIncident.latitude, lon: selectedIncident.longitude }} 
                        viewMode="police"
                        zoom={16}
                     />
                     <div className="absolute inset-0 pointer-events-none border-4 border-blue-500/20"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-[9px] font-black opacity-50 uppercase mb-1">Grid Status</p>
                      <p className="font-black text-sm uppercase text-blue-500">{selectedIncident.status}</p>
                   </div>
                   <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-[9px] font-black opacity-50 uppercase mb-1">Officer Assigned</p>
                      <p className="font-black text-sm uppercase truncate">{selectedIncident.assigned_officer_name || 'NONE'}</p>
                   </div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                   <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Subject Information</h4>
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs uppercase">
                         {selectedIncident.reporter_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-tight">{selectedIncident.reporter_name || 'ANONYMOUS SUBJECT'}</p>
                        <p className="text-[10px] opacity-60 font-bold uppercase">ID: {selectedIncident.user_id?.slice(0, 12) || 'UNKNOWN'}</p>
                      </div>
                   </div>
                   <p className="text-xs font-bold opacity-70">REPORTED AT: {new Date(selectedIncident.created_at).toLocaleString()}</p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Command Directives</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedIncident.status !== 'resolved' && (
                      <>
                        <button 
                          onClick={() => handleAssignOfficer(selectedIncident.id)}
                          disabled={isActionLoading}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700 transition"
                        >
                          <span className="flex items-center gap-2"><Users size={16}/> DEPLOY UNIT</span>
                          <Zap size={14} />
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(selectedIncident.id, 'resolved')}
                          disabled={isActionLoading}
                          className="w-full flex items-center justify-between p-4 rounded-2xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition"
                        >
                          <span className="flex items-center gap-2"><CheckCircle2 size={16}/> TERMINATE INCIDENT</span>
                          <CheckCircle2 size={14} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleAddFir(selectedIncident.id)}
                      disabled={isActionLoading}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border font-black text-xs transition ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                    >
                      <span className="flex items-center gap-2"><Shield size={16}/> {selectedIncident.fir_id ? 'AMEND E-FIR' : 'FILE E-FIR'}</span>
                      {selectedIncident.fir_id && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-lg font-mono">{selectedIncident.fir_id}</span>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-12 opacity-30">
              <Activity size={80} className="mb-6 animate-pulse text-blue-600" />
              <h3 className="font-black uppercase text-xl tracking-[0.2em] mb-2">Tactical HUD</h3>
              <p className="text-xs font-bold leading-relaxed">System standby. Select an active incident from the tactical feed to begin engagement.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, isDark }) => {
  const colors = {
    blue: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500',
    orange: 'border-orange-500/30 bg-orange-500/5 hover:border-orange-500',
    emerald: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500',
    red: 'border-red-500/30 bg-red-500/5 hover:border-red-500',
  };

  return (
    <div className={`p-6 rounded-3xl border-2 flex items-center gap-5 shadow-sm transition-all hover:scale-[1.02] ${colors[color]} ${isDark ? 'text-white' : 'text-slate-900'}`}>
      <div className={`p-4 rounded-2xl shadow-inner flex-shrink-0 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">{title}</p>
        <p className="text-4xl font-black tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export default PolicePanel;
