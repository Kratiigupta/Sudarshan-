import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap, Polyline } from 'react-leaflet';
import { Crosshair, MapPin, Navigation, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Icons
const disasterIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const poiIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const incidentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const criticalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, map.getZoom(), { animate: true, duration: 1.5 });
  }, [center, map]);
  return null;
};

class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Map Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-center bg-red-50 text-red-600 rounded-3xl font-bold border border-red-200">Map temporarily unavailable. Please refresh or check connection.</div>;
    }
    return this.props.children;
  }
}

const LiveMap = ({ onAlert, viewMode = 'tourist', userLocation, globalAlerts, poiType, incidents = [], hotspots = [], zoom = 14, showHeatmap = false, showClusters = false }) => {
  const [currentPosition, setCurrentPosition] = useState([28.6139, 77.2090]); 
  const [routeHistory, setRouteHistory] = useState([]); 
  const [isSafe, setIsSafe] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyPOIs, setNearbyPOIs] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [routingInfo, setRoutingInfo] = useState(null);
  const [showLegend, setShowLegend] = useState(false);
  const [mockClusters, setMockClusters] = useState([]);

  // Generate mock tourist clusters for police view
  useEffect(() => {
    if (showClusters && currentPosition) {
      const clusters = [];
      for (let i = 0; i < 20; i++) {
        // Randomly generate tourists within ~2km radius
        const latOffset = (Math.random() - 0.5) * 0.04;
        const lonOffset = (Math.random() - 0.5) * 0.04;
        clusters.push({
          id: `tourist-${i}`,
          lat: currentPosition[0] + latOffset,
          lon: currentPosition[1] + lonOffset,
        });
      }
      setMockClusters(clusters);
    }
  }, [showClusters, currentPosition]);

  const [isPoiLoading, setIsPoiLoading] = useState(false);

  // Sync with App.jsx location
  useEffect(() => {
    if (userLocation) {
      setCurrentPosition([userLocation.lat, userLocation.lon]);
      setRouteHistory(prev => [...prev, [userLocation.lat, userLocation.lon]]);
    }
  }, [userLocation]);

  // Find POIs when poiType changes
  useEffect(() => {
    if (poiType && currentPosition) {
      findNearbyPOIs(poiType);
    }
  }, [poiType, currentPosition]);

  // Calculate distance between two lat/lon points
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  const findNearbyPOIs = async (type) => {
    setIsPoiLoading(true);
    let query = '';
    
    // Highly robust Overpass queries to act like Google Maps (max 25km radius, broad exact OSM tags)
    if (type === 'Hospitals') {
      query = `[out:json][timeout:15];(nwr["amenity"~"hospital|clinic|doctors"](around:25000,${currentPosition[0]},${currentPosition[1]});nwr["healthcare"](around:25000,${currentPosition[0]},${currentPosition[1]}););out center;`;
    } else if (type === 'Police') {
      query = `[out:json][timeout:15];(nwr["amenity"="police"](around:25000,${currentPosition[0]},${currentPosition[1]});nwr["police"](around:25000,${currentPosition[0]},${currentPosition[1]}););out center;`;
    } else if (type === 'Museums') {
      query = `[out:json][timeout:15];(nwr["tourism"="museum"](around:25000,${currentPosition[0]},${currentPosition[1]}););out center;`;
    } else {
      query = `[out:json][timeout:15];(nwr["leisure"="park"](around:25000,${currentPosition[0]},${currentPosition[1]}););out center;`;
    }
    
    try {
      const overpassServers = [
        'https://lz4.overpass-api.de/api/interpreter',
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter'
      ];
      
      let data = null;
      for (const server of overpassServers) {
        try {
          const res = await fetch(`${server}?data=${encodeURIComponent(query)}`, { timeout: 10000 });
          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch (e) {
          console.warn(`Server ${server} failed or timed out. Trying next...`);
        }
      }
      
      if (!data) throw new Error("All mapping servers are currently unreachable.");
      
      let sortedPois = [];
      if (data && data.elements && data.elements.length > 0) {
        const parsedPois = data.elements.map(e => {
          const lat = e.lat || e.center?.lat;
          const lon = e.lon || e.center?.lon;
          
          let defaultName = `${type} Facility`;
          if (type === 'Police') {
            defaultName = 'Police Station';
          }

          return {
            id: e.id,
            pos: [lat, lon],
            name: e.tags?.name || defaultName,
            distance: getDistance(currentPosition[0], currentPosition[1], lat, lon)
          };
        }).filter(e => e.pos[0] && e.pos[1]).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)).slice(0, 5);
        
        setNearbyPOIs(parsedPois);
      } else {
        setNearbyPOIs([]);
      }

    } catch (err) { 
      console.error("POI Error:", err);
      setNearbyPOIs([]);
    } finally {
      setIsPoiLoading(false);
    }
  };

  const calculateRoute = async (dest) => {
    const url = `https://router.project-osrm.org/route/v1/driving/${currentPosition[1]},${currentPosition[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        setRoutePath(coords);
        setRoutingInfo({
          distance: (data.routes[0].distance / 1000).toFixed(1),
          duration: Math.round(data.routes[0].duration / 60)
        });
      }
    } catch (err) { console.error("Routing Error:", err); }
  };

  const fetchMyLocation = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition([position.coords.latitude, position.coords.longitude]);
          setIsLocating(false);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true }
      );
    }
  };

  const clearRoute = () => {
    setRoutePath([]);
    setRoutingInfo(null);
  };

  return (
    <div className="relative w-full h-full min-h-[400px]">
      
      <button 
        onClick={fetchMyLocation}
        disabled={isLocating}
        className="absolute top-4 right-4 z-[780] bg-white text-blue-600 p-3 rounded-full shadow-lg border border-blue-100 hover:bg-blue-50 transition flex items-center justify-center disabled:opacity-50"
      >
        <Crosshair size={24} className={isLocating ? "animate-spin" : ""} />
      </button>

      {routingInfo && (
        <div className="absolute top-4 left-4 z-[780] bg-white/90 p-4 rounded-2xl shadow-xl border border-blue-100 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-3 text-blue-900">
            <Navigation size={24} className="animate-bounce" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Route Found</p>
              <p className="text-lg font-black">{routingInfo.distance} km (Driving) • {routingInfo.duration} mins</p>
            </div>
            <button
              onClick={clearRoute}
              className="ml-2 text-[10px] font-black uppercase bg-gray-100 px-2 py-1 rounded-md hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {viewMode === 'tourist' && (
        <div className="absolute top-20 left-4 z-[780] max-w-[260px] bg-white/90 rounded-2xl border border-gray-200 shadow-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Map Safety Panel</p>
            <button
              onClick={() => setShowLegend((prev) => !prev)}
              className="text-[10px] font-bold text-blue-600 hover:underline"
            >
              {showLegend ? 'Hide' : 'Show'} Legend
            </button>
          </div>
          <p className="mt-1 text-xs font-semibold text-gray-700">
            {poiType ? `Showing nearest ${poiType.toLowerCase()} and route options.` : 'Choose Hospitals or Police from top controls for nearby help.'}
          </p>
          {showLegend && (
            <div className="mt-2 text-[10px] font-bold text-gray-600 space-y-1">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Disaster alert marker</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> Help point marker</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> Your live location</div>
            </div>
          )}
        </div>
      )}

      <MapErrorBoundary>
        <MapContainer 
          center={currentPosition} 
          zoom={zoom} 
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', minHeight: '400px', zIndex: 10 }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
          <MapUpdater center={currentPosition} />

          {/* User Marker */}
          {currentPosition && !isNaN(currentPosition[0]) && !isNaN(currentPosition[1]) && (
            <Marker position={[parseFloat(currentPosition[0]), parseFloat(currentPosition[1])]}>
              <Popup><strong>You are here</strong></Popup>
            </Marker>
          )}
          
          {/* Disaster Markers */}
          {globalAlerts && Array.isArray(globalAlerts) && globalAlerts.map((d, i) => {
            const lat = parseFloat(d.lat);
            const lon = parseFloat(d.lon);
            if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
              return (
                <Marker key={`disaster-${i}`} position={[lat, lon]} icon={disasterIcon}>
                  <Popup>
                    <div className="p-1">
                      <p className="text-red-600 font-black text-xs uppercase tracking-widest">{d.type || 'Alert'}</p>
                      <h4 className="font-bold text-sm">{d.name || 'Safety Incident'}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{d.country || ''} • Alert Level: {d.level || 'Unknown'}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}

          {/* HEATMAP LAYER */}
          {showHeatmap && incidents.map((inc, i) => {
            const lat = parseFloat(inc.latitude);
            const lon = parseFloat(inc.longitude);
            if (!isNaN(lat) && !isNaN(lon)) {
              return (
                <Circle 
                  key={`heat-inc-${i}`}
                  center={[lat, lon]}
                  pathOptions={{ fillColor: 'red', fillOpacity: 0.2, color: 'transparent' }}
                  radius={800} // large radius for heatmap effect
                />
              );
            }
            return null;
          })}
          
          {showHeatmap && hotspots.map((hs, i) => {
             const lat = parseFloat(hs.latitude);
             const lon = parseFloat(hs.longitude);
             if (!isNaN(lat) && !isNaN(lon)) {
               return (
                 <Circle 
                   key={`heat-hs-${i}`}
                   center={[lat, lon]}
                   pathOptions={{ fillColor: 'orange', fillOpacity: 0.15, color: 'transparent' }}
                   radius={1200} 
                 />
               );
             }
             return null;
          })}

          {/* TOURIST CLUSTERS */}
          {showClusters && mockClusters.map(c => (
             <CircleMarker 
               key={c.id} 
               center={[c.lat, c.lon]} 
               pathOptions={{ fillColor: '#10b981', color: '#047857', weight: 1, fillOpacity: 0.7 }}
               radius={6}
             >
               <Popup>
                 <div className="text-center p-1">
                   <p className="font-bold text-xs">Tourist Activity</p>
                   <p className="text-[10px] text-gray-500">Live tracker signal</p>
                 </div>
               </Popup>
             </CircleMarker>
          ))}

          {/* Nearby POIs */}
          {nearbyPOIs && Array.isArray(nearbyPOIs) && nearbyPOIs.map((poi, i) => {
            if (poi.pos && !isNaN(parseFloat(poi.pos[0])) && !isNaN(parseFloat(poi.pos[1]))) {
              return (
                <Marker key={`poi-${i}`} position={[parseFloat(poi.pos[0]), parseFloat(poi.pos[1])]} icon={poiIcon} eventHandlers={{ click: () => calculateRoute(poi.pos) }}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-black text-blue-900">{poi.name || 'Nearby Spot'}</p>
                      <button 
                        onClick={() => calculateRoute(poi.pos)}
                        className="mt-2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                      >
                        GET DIRECTIONS
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}

          {/* Routing Polyline */}
          {routePath && Array.isArray(routePath) && routePath.length > 0 && <Polyline positions={routePath} color="#2563eb" weight={6} opacity={0.8} dashArray="10, 10" />}

          {/* Actual Incidents (Police View) */}
          {viewMode === 'police' && incidents && incidents.map((inc, i) => (
            <Marker 
              key={`incident-${inc.id}-${i}`} 
              position={[inc.latitude, inc.longitude]} 
              icon={inc.severity === 'critical' ? criticalIcon : incidentIcon}
            >
              <Popup>
                <div className="p-1">
                  <p className="text-blue-600 font-black text-[10px] uppercase">{inc.type}</p>
                  <h4 className="font-bold text-sm">Case #{inc.id.slice(0, 8)}</h4>
                  <p className="text-[10px] mt-1">{inc.description}</p>
                  <p className={`text-[10px] font-bold mt-1 ${inc.status === 'resolved' ? 'text-emerald-600' : 'text-orange-600'}`}>
                    STATUS: {inc.status.toUpperCase()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Hotspots (Circles) */}
          {hotspots && hotspots.map((spot, i) => (
            <Circle
              key={`hotspot-${spot.id}-${i}`}
              center={[spot.latitude, spot.longitude]}
              radius={spot.radius_meters || 500}
              pathOptions={{
                color: 'red',
                fillColor: 'red',
                fillOpacity: 0.2,
                weight: 1
              }}
            >
              <Popup>
                <div className="p-1">
                  <p className="text-red-600 font-black text-[10px] uppercase">DANGER ZONE</p>
                  <h4 className="font-bold text-sm">{spot.type}</h4>
                  <p className="text-[10px]">{spot.description}</p>
                </div>
              </Popup>
            </Circle>
          ))}

        </MapContainer>
      </MapErrorBoundary>

      <div className="absolute bottom-4 left-4 z-[780] bg-white/90 px-4 py-2 rounded-xl shadow-lg border border-gray-200 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-700">
        <div className={`w-2.5 h-2.5 rounded-full ${userLocation ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
        {userLocation ? 'REAL-TIME GPS ACTIVE' : 'WAITING FOR GPS'}
      </div>

      {(isPoiLoading || (nearbyPOIs && nearbyPOIs.length > 0) || (poiType && !isPoiLoading && nearbyPOIs.length === 0)) && (
        <div className="absolute bottom-4 right-4 z-[780] max-h-[300px] overflow-y-auto w-[250px] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 animate-fade-in p-3 hidden sm:block">
          <p className="text-[10px] font-black uppercase tracking-widest text-center pb-2 text-blue-600 border-b border-gray-100">
            {isPoiLoading ? 'Scanning Grid...' : `Nearest ${poiType}`}
          </p>
          
          {isPoiLoading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <p className="text-[10px] font-bold text-gray-400">CONNECTING TO SATELLITE...</p>
            </div>
          ) : nearbyPOIs.length > 0 ? (
            <div className="flex flex-col gap-2 mt-2">
              {nearbyPOIs.map((poi, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition border border-transparent hover:border-blue-200 cursor-pointer shadow-sm" onClick={() => calculateRoute(poi.pos)}>
                  <h4 className="font-bold text-sm truncate text-gray-800">{poi.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-md border">{poi.distance} km (Aerial)</span>
                    <span className="text-[10px] font-black text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md transition shadow-sm">GO</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs font-bold text-gray-400">No {poiType} found within 15km tactical radius.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveMap;