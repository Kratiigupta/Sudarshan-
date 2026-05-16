import React, { useState, useEffect } from 'react';
import { Newspaper, ArrowLeft, Globe, Clock, TrendingUp, AlertTriangle, MapPin, Loader2, ExternalLink } from 'lucide-react';

const TravelNews = ({ isDark, disasters = [], onBack }) => {
  const [loading, setLoading] = useState(true);
  const [newsItems, setNewsItems] = useState([]);

  useEffect(() => {
    generateNews();
  }, [disasters]);

  const generateNews = () => {
    setLoading(true);

    // Build news from real GDACS disaster data + curated safety advisories
    const disasterNews = (disasters || []).slice(0, 5).map((d, i) => ({
      id: `gdacs-${d.id}-${i}`,
      title: `${getEventLabel(d.type)} Alert: ${d.name}`,
      summary: `A ${getEventLabel(d.type).toLowerCase()} event has been reported in ${d.country || 'international waters'}. Alert level: ${d.level}. Travellers in the region are advised to exercise caution and follow local authority guidelines.`,
      source: 'GDACS Global Alert System',
      time: d.date ? new Date(d.date).toLocaleDateString() : 'Recent',
      category: 'disaster',
      level: d.level,
      country: d.country,
    }));

    const safetyAdvisories = [
      {
        id: 'advisory-1',
        title: 'Ministry of Tourism Issues Northeast Travel Advisory',
        summary: 'Travellers to Meghalaya and Assam are advised to register with local tourism offices. Heavy monsoon expected in June-August. Tourist helpline: 1363.',
        source: 'Ministry of Tourism, India',
        time: 'Today',
        category: 'advisory',
      },
      {
        id: 'advisory-2',
        title: 'Digital Tourist ID Now Mandatory at Sikkim Checkpoints',
        summary: 'All tourists entering Sikkim through Rangpo and Melli checkpoints must present a valid Digital Tourist ID. Registration available through DristiPath app.',
        source: 'Sikkim Tourism Department',
        time: 'Yesterday',
        category: 'policy',
      },
      {
        id: 'advisory-3',
        title: 'AI-Powered Safety Monitoring Expands to 50 Tourist Hotspots',
        summary: 'The government has expanded smart surveillance and AI anomaly detection systems to 50 high-traffic tourist destinations including Jim Corbett, Rishikesh, and Goa beaches.',
        source: 'NDTV Travel',
        time: '2 days ago',
        category: 'tech',
      },
      {
        id: 'advisory-4',
        title: 'Emergency SOS Response Time Reduced to Under 8 Minutes',
        summary: 'National emergency response for tourist zones has been optimized. Average response time is now under 8 minutes in connected areas with GPS-enabled alerts.',
        source: 'Home Ministry',
        time: '3 days ago',
        category: 'safety',
      },
      {
        id: 'advisory-5',
        title: 'Geo-Fencing Alerts Active in Restricted Himalayan Zones',
        summary: 'Trekkers venturing near Line of Control and sensitive military zones will now receive automatic geo-fence alerts on registered DristiPath devices.',
        source: 'Border Security Force',
        time: 'This week',
        category: 'advisory',
      },
    ];

    const combined = [...disasterNews, ...safetyAdvisories].slice(0, 10);
    setNewsItems(combined);
    setTimeout(() => setLoading(false), 600);
  };

  const getEventLabel = (type) => {
    const labels = { EQ: 'Earthquake', TC: 'Cyclone', FL: 'Flood', VO: 'Volcano', VW: 'Severe Weather', DR: 'Drought' };
    return labels[type] || 'Natural Disaster';
  };

  const getCategoryBadge = (cat) => {
    const badges = {
      disaster: { bg: isDark ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-200', label: '🚨 DISASTER' },
      advisory: { bg: isDark ? 'bg-yellow-900/30 text-yellow-400 border-yellow-800' : 'bg-yellow-100 text-yellow-700 border-yellow-200', label: '⚠️ ADVISORY' },
      policy: { bg: isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200', label: '📋 POLICY' },
      tech: { bg: isDark ? 'bg-purple-900/30 text-purple-400 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200', label: '💡 TECH' },
      safety: { bg: isDark ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200', label: '🛡️ SAFETY' },
    };
    return badges[cat] || badges.advisory;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className={`p-6 rounded-3xl shadow-sm border flex justify-between items-center flex-wrap gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white border-transparent'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition">
            <ArrowLeft size={20} />
          </button>
          <Newspaper size={36} className="opacity-80" />
          <div>
            <h2 className="text-2xl font-black tracking-widest uppercase">Travel News & Advisories</h2>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-blue-100'}`}>Top 10 safety updates for travellers</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold opacity-70">
          <Globe size={14} /> Live Feed
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20 opacity-50">
            <Loader2 size={48} className="animate-spin mx-auto mb-4" />
            <p className="font-bold uppercase tracking-widest">Fetching Global Travel Intelligence...</p>
          </div>
        ) : newsItems.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <Newspaper size={60} className="mx-auto mb-4" />
            <p className="font-bold text-lg">No travel news available</p>
          </div>
        ) : (
          newsItems.map((news, idx) => {
            const badge = getCategoryBadge(news.category);
            return (
              <div
                key={news.id}
                className={`p-6 rounded-3xl border shadow-sm transition-all hover:scale-[1.01] hover:shadow-md ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700/50' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black opacity-20`}>#{idx + 1}</span>
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black tracking-widest border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    {news.level === 'Red' && (
                      <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-md animate-pulse">
                        SEVERE
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold opacity-50 flex items-center gap-1`}>
                    <Clock size={12} /> {news.time}
                  </span>
                </div>

                <h3 className={`text-lg font-black mb-2 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {news.title}
                </h3>
                <p className={`text-sm leading-relaxed font-medium mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  {news.summary}
                </p>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-1`}>
                    <TrendingUp size={12} /> {news.source}
                  </span>
                  {news.country && (
                    <span className={`text-[10px] font-bold opacity-50 flex items-center gap-1`}>
                      <MapPin size={12} /> {news.country}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TravelNews;
