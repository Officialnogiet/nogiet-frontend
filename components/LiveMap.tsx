import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Plus,
  Minus,
  X,
  ExternalLink,
  Calendar,
  Share2,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

interface LiveMapProps {
  onOpenFilters?: () => void;
  darkMode?: boolean;
}

const HOTSPOTS = [
  { id: '1', name: 'Kano', lng: 8.5224, lat: 12.0022, size: 40 },
  { id: '2', name: 'Kaduna', lng: 7.435, lat: 10.5105, size: 35 },
  { id: '3', name: 'Abuja', lng: 7.4913, lat: 9.0765, size: 50 },
  { id: '4', name: 'Minna', lng: 6.5569, lat: 9.6143, size: 30 },
  { id: '5', name: 'Lafia', lng: 8.5153, lat: 8.4855, size: 28 },
  { id: '6', name: 'Enugu', lng: 7.5083, lat: 6.4483, size: 35 },
  { id: '7', name: 'Ilorin', lng: 4.5484, lat: 8.4799, size: 32 },
  { id: '8', name: 'Ibadan', lng: 3.947, lat: 7.3775, size: 40 },
  { id: '9', name: 'Onitsha', lng: 6.7865, lat: 6.1527, size: 25 },
  { id: '10', name: 'Port Harcourt', lng: 7.0085, lat: 4.7774, size: 35 },
  { id: '11', name: 'Oyo', lng: 3.9312, lat: 7.8504, size: 22 },
  { id: '12', name: 'Ado Ekiti', lng: 5.2181, lat: 7.6163, size: 28 },
  { id: '13', name: 'Makurdi', lng: 8.5307, lat: 7.7322, size: 32 },
];

const ALERTS = [
  { id: 'a1', facility: 'Delta Facility A - High Output', output: '1250kg/hr', time: '3hrs ago' },
  { id: 'a2', facility: 'Escravos Node - Abnormal Pressure', output: '980kg/hr', time: '5hrs ago' },
];

const CHART_DATA = [
  { date: '12-01', rate: 1850 },
  { date: '13-01', rate: 1600 },
  { date: '14-01', rate: 3200 },
  { date: '15-01', rate: 1400 },
  { date: '16-01', rate: 1400 },
  { date: '17-01', rate: 1000 },
  { date: '18-01', rate: 1300 },
];

const LiveMap: React.FC<LiveMapProps> = ({ onOpenFilters, darkMode = true }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAlerts, setShowAlerts] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExportCSV = () => {
    const headers = ['Date', 'Rate (kg/hr)'];
    const csvContent = [
      headers.join(','),
      ...CHART_DATA.map(item => `${item.date},${item.rate}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `emission_data_${selectedFacility?.name || 'export'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareReport = () => {
    const doc = new jsPDF();

    // Add Report Header
    doc.setFontSize(22);
    doc.text('Emission Analytics Report', 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Facility: ${selectedFacility?.name || 'N/A'}`, 14, 30);
    doc.text(`Date of Report: ${new Date().toLocaleDateString()}`, 14, 37);

    // Add Data Table
    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Emission Rate (kg/hr)']],
      body: CHART_DATA.map(item => [item.date, `${item.rate} kg/hr`]),
      theme: 'striped',
      headStyles: { fillColor: [13, 148, 136] }, // Teal-600 color equivalent in RGB
    });

    doc.save(`NOGIET_Report_${selectedFacility?.name || 'FACILITY'}.pdf`);
  };

  useEffect(() => {
    if (map.current) {
      map.current.setStyle(darkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11');
    }
  }, [darkMode]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    if (!mapboxgl.accessToken) {
      setError('Mapbox access token is missing. Please check your .env file.');
      return;
    }

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: darkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11',
        center: [8.6753, 9.082],
        zoom: 5.8,
        attributionControl: false,
        failIfMajorPerformanceCaveat: false,
        preserveDrawingBuffer: true,
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        setMapLoaded(true);

        const bounds = new mapboxgl.LngLatBounds();


        HOTSPOTS.forEach((spot) => {
          const el = document.createElement('div');
          el.className = 'custom-marker'; // optional: add CSS class for styling
          el.style.width = '60px';
          el.style.height = '60px';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.cursor = 'pointer';
          el.style.pointerEvents = 'auto'; // important for clicks

          // The glowing effect + central dot + label below
          el.innerHTML = `
              <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                <div style="width: ${spot.size * 2}px; height: ${spot.size * 2}px; background: rgba(20, 184, 166, 0.25); border-radius: 50%; filter: blur(10px); position: absolute;"></div>
                <div style="width: 14px; height: 14px; background: #14b8a6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(20,184,166,0.7); position: relative; z-index: 2;"></div>
                <span style="position: absolute; top: 100%; margin-top: 10px; font-size: 11px; font-weight: 700; color: ${darkMode ? '#9ca3af' : '#1f2937'}; white-space: nowrap; pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                  ${spot.name}
                </span>
              </div>
            `;

          // Attach click handler directly to the element (Mapbox markers use DOM events)
          el.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent map click interference
            handleFacilityClick(spot);
          });

          new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([spot.lng, spot.lat])
            .addTo(map.current!);

          bounds.extend([spot.lng, spot.lat]);
        });


        // Optional: fit bounds to all points with nice padding
        if (!bounds.isEmpty() && map.current) {   // extra safety
          map.current.fitBounds(bounds, {
            padding: { top: 120, bottom: 120, left: 80, right: 80 },
            duration: 1200,
          });
        }

        // Your existing resizes...
        setTimeout(() => map.current?.resize(), 300);
        setTimeout(() => map.current?.resize(), 800);
      });

      // Catch style/tile errors and log clearly
      map.current.on('error', (e) => {
        console.error('Mapbox error event:', e.error?.message || e);
        if (e.error?.message?.includes('access token') || e.error?.message?.includes('token')) {
          setError('Invalid or restricted Mapbox access token. Generate a new one at account.mapbox.com.');
        } else if (e.error?.message?.includes('tile') || e.error?.message?.includes('sprite') || e.error?.message?.includes('glyph')) {
          console.warn('Tile/sprite/glyph fetch failed — likely transient network issue. Map may recover automatically.');
          // Optional: retry style load after delay
          setTimeout(() => {
            if (map.current && !mapLoaded) {
              map.current.setStyle('mapbox://styles/mapbox/light-v11');
            }
          }, 2000);
        } else {
          setError('Map initialization error. Check console.');
        }
      });

      // Optional: listen for data loading progress
      map.current.on('sourcedata', (e) => {
        if (e.isSourceLoaded) {
          console.log('Source data loaded');
        }
      });

    } catch (err: any) {
      console.error('Critical map init failed:', err);
      setError('Failed to create Mapbox instance. Check token and browser support.');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const handleFacilityClick = (spot: any) => {
    setSelectedFacility({
      ...spot,
      sector: 'Refinery',
      gasType: 'CH4',
      emissionRate: '2,450 kg/hr',
      source: 'CarbonMapper',
      persistence: '13%',
      plumes: 1,
      instrument: 'NASA EMIT',
    });
  };

  const zoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  return (
    <div className={`relative h-full w-full overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#0b0e14]' : 'bg-gray-50'}`}>
      {/* Map container */}
      <div
        ref={mapContainer}
        className="absolute inset-0 z-0"
        style={{ background: mapLoaded ? 'transparent' : (darkMode ? '#0b0e14' : '#e5e7eb') }}
      />

      {/* Loading / Error overlay */}
      {!mapLoaded && !error && (
        <div className={`absolute inset-0 flex items-center justify-center z-50 transition-colors ${darkMode ? 'bg-[#0b0e14]/80' : 'bg-gray-100/80'}`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className={`mt-4 font-medium ${darkMode ? 'text-teal-400' : 'text-gray-600'}`}>Loading map...</p>
          </div>
        </div>
      )}

      {error && (
        <div className={`absolute inset-0 flex items-center justify-center z-50 p-6 ${darkMode ? 'bg-[#0b0e14]/90' : 'bg-red-50/90'}`}>
          <div className={`p-8 rounded-2xl shadow-xl max-w-md text-center border ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white'}`}>
            <AlertCircle className="mx-auto text-red-500" size={48} />
            <h3 className={`mt-4 text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Map Error</h3>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
            <p className="mt-4 text-sm text-gray-500">
              Make sure you have set a valid MAPBOX_TOKEN in your environment variables.
            </p>
          </div>
        </div>
      )}

      {/* Grid overlay (visual style) */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none z-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Top search bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-40">
        <div className={`h-16 rounded-3xl flex items-center justify-between px-6 shadow-2xl border transition-all ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-[#002f2a] border-teal-900/30'
          }`}>
          <div className="flex items-center gap-4 flex-1">
            <Search className={darkMode ? 'text-gray-400' : 'text-teal-400/80'} size={20} />
            <input
              className={`bg-transparent border-none focus:outline-none w-full text-sm font-medium ${darkMode ? 'text-white placeholder-gray-600' : 'text-white placeholder-teal-100/50'
                }`}
              placeholder="Search facility, pipeline or coordinates…"
            />
          </div>
          <div className="h-8 w-px bg-white/10 mx-6" />
          <button
            onClick={onOpenFilters}
            className={`flex items-center gap-2 text-sm font-semibold transition-colors ${darkMode ? 'text-gray-400 hover:text-[#009688]' : 'text-white hover:text-teal-300'
              }`}
          >
            Filters
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Alert toggle */}
      <div className="absolute top-28 left-6 z-40">
        <button
          onClick={() => setShowAlerts(!showAlerts)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl transition-all ${showAlerts
            ? 'bg-red-600 text-white'
            : darkMode ? 'bg-[#12161f] text-gray-400 hover:bg-[#1e2430]' : 'bg-[#003d33] text-teal-300 hover:bg-[#004d40]'
            }`}
        >
          <AlertCircle size={24} />
        </button>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-8 right-8 z-40 flex flex-col gap-3">
        <button
          onClick={zoomIn}
          className="w-12 h-12 bg-teal-600 hover:bg-teal-700 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
        >
          <Plus size={24} />
        </button>
        <button
          onClick={zoomOut}
          className="w-12 h-12 bg-teal-600 hover:bg-teal-700 rounded-2xl flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
        >
          <Minus size={24} />
        </button>
      </div>

      {/* Summary card - bottom left */}
      <div className={`absolute bottom-8 left-6 backdrop-blur-lg shadow-2xl rounded-3xl p-8 w-80 border z-40 transition-colors ${darkMode ? 'bg-[#12161f]/90 border-[#1e2430]' : 'bg-white/95 border-gray-100/80'
        }`}>
        <div className="mb-8">
          <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Emission Sources</h3>
          <p className="text-xs text-gray-500 mt-1">CH₄ • Current View</p>
          <p className={`text-5xl font-black mt-3 tracking-tight ${darkMode ? 'text-[#009688]' : 'text-gray-900'}`}>2.5k</p>
        </div>
        <div>
          <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Plumes Detected</h3>
          <p className="text-xs text-gray-500 mt-1">CH₄ • Current View</p>
          <p className={`text-5xl font-black mt-3 tracking-tight ${darkMode ? 'text-[#009688]' : 'text-gray-900'}`}>12.4k</p>
        </div>
      </div>

      {/* Alerts panel */}
      {showAlerts && (
        <div className={`absolute top-36 left-28 backdrop-blur-xl rounded-3xl shadow-2xl w-96 border p-6 z-50 transition-colors ${darkMode ? 'bg-[#12161f]/95 border-[#1e2430]' : 'bg-white/95 border-gray-100'
          }`}>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              <span className="font-bold text-lg">Recent Alerts</span>
            </div>
            <button
              onClick={() => setShowAlerts(false)}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
            {ALERTS.map((alert) => (
              <div
                key={alert.id}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group ${darkMode ? 'bg-[#0b0e14]/50 border-[#1e2430] hover:border-red-500/50 hover:bg-red-500/5' : 'bg-gray-50 border-gray-100 hover:border-red-200 hover:bg-red-50/50'
                  }`}
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1 w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] group-hover:scale-125 transition-transform" />
                  <div>
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{alert.facility}</p>
                    <div className="flex items-center gap-2 text-xs mt-1.5">
                      <span className="text-teal-500 font-medium">{alert.output}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500">{alert.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className={`w-full mt-6 py-4 rounded-2xl font-bold transition-colors ${darkMode ? 'bg-gray-800 text-teal-400 hover:bg-gray-750' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
            }`}>
            View All Alerts
          </button>
        </div>
      )}

      {/* Facility popup / modal */}
      {selectedFacility && (
        <>
          {/* Mini popup when not expanded */}
          {!isExpanded && (
            <div className={`absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl shadow-2xl w-72 p-6 border z-50 transition-colors ${darkMode ? 'bg-[#12161f] border-[#1e2430]' : 'bg-white border-gray-100'
              }`}>
              <h3 className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedFacility.name} Node</h3>
              <button className="text-teal-500 text-xs font-bold mt-2 flex items-center gap-1 hover:underline">
                Open in Google Maps <ExternalLink size={12} />
              </button>

              <div className="mt-5 space-y-4 text-sm">
                <div className={`flex justify-between py-2 border-b ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
                  <span className="text-gray-500">Sector</span>
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>Oil & Gas</span>
                </div>
                <div className={`flex justify-between py-2 border-b ${darkMode ? 'border-[#1e2430]' : 'border-gray-50'}`}>
                  <span className="text-gray-500">Gas Type</span>
                  <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>CH₄</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Emission Rate</span>
                  <span className="font-bold text-teal-600">{selectedFacility.emissionRate}</span>
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(true)}
                className="w-full mt-6 bg-teal-600 text-white py-3 rounded-2xl font-bold hover:bg-teal-700 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                View Full Details <ChevronRight size={16} />
              </button>

              <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 border-8 border-transparent ${darkMode ? 'border-t-[#12161f]' : 'border-t-white'}`} />
            </div>
          )}

          {/* Expanded modal */}
          {isExpanded && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
              <div className={`rounded-3xl w-full max-w-6xl h-[90vh] max-h-[850px] shadow-2xl overflow-hidden flex flex-col transition-colors ${darkMode ? 'bg-[#12161f]' : 'bg-white'
                }`}>
                {/* Header */}
                <div className={`px-10 py-6 border-b flex justify-between items-center ${darkMode ? 'bg-[#0b0e14]/50 border-[#1e2430]' : 'bg-gray-50/50 border-gray-100'}`}>
                  <div>
                    <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedFacility.name} Node</h2>
                    <p className="text-teal-600 text-sm mt-1 flex items-center gap-2">
                      <ExternalLink size={14} />
                      {selectedFacility.lat.toFixed(4)}° N, {selectedFacility.lng.toFixed(4)}° E
                    </p>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className={`p-3 rounded-full transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-500 hover:text-gray-400' : 'hover:bg-gray-200 text-gray-600'}`}
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {/* Left sidebar */}
                  <div className={`w-80 p-10 border-r flex flex-col transition-colors ${darkMode ? 'bg-[#0b0e14] border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="mb-12">
                      <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Current Emission Rate
                      </p>
                      <div className="flex items-baseline gap-3">
                        <span className={`text-6xl font-black ${darkMode ? 'text-[#009688]' : 'text-teal-700'}`}>2,450</span>
                        <span className="text-xl font-bold text-gray-500">kg/hr</span>
                      </div>
                    </div>

                    <div className="space-y-8 flex-1">
                      {[
                        { label: 'Gas Type', value: 'CH₄' },
                        { label: 'Data Source', value: 'CarbonMapper' },
                        { label: 'Persistence', value: '13%' },
                        { label: 'Active Plumes', value: '1' },
                        { label: 'Instrument', value: 'NASA EMIT' },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                            {item.label}
                          </p>
                          <p className={`text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className={`pt-8 mt-auto border-t text-xs italic ${darkMode ? 'border-gray-800 text-gray-600' : 'border-gray-200 text-gray-500'}`}>
                      Data from CarbonMapper L4 • Confidence: 94% • Updated 2 min ago
                    </div>
                  </div>

                  {/* Chart area */}
                  <div className="flex-1 p-10 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Emission History</h3>
                      <button className={`flex items-center gap-2 px-5 py-2.5 border rounded-2xl text-sm font-medium transition-colors ${darkMode ? 'border-[#1e2430] bg-[#0b0e14] text-gray-400 hover:bg-gray-800' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}>
                        <Calendar size={16} className="text-teal-600" />
                        Jan 12 – 18, 2026
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={CHART_DATA}>
                          <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#14b8a6" />
                              <stop offset="95%" stopColor="#0f766e" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="4 4" vertical={false} stroke={darkMode ? '#1e2430' : '#f0f0f0'} />
                          <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                            dy={12}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
                            unit=" kg/hr"
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                            contentStyle={{
                              backgroundColor: '#111827',
                              border: 'none',
                              borderRadius: '12px',
                              color: 'white',
                              padding: '12px 16px',
                            }}
                          />
                          <Bar
                            dataKey="rate"
                            fill="url(#colorRate)"
                            radius={[8, 8, 0, 0]}
                            barSize={48}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className={`px-10 py-6 border-t flex justify-end gap-4 transition-colors ${darkMode ? 'bg-[#0b0e14]/50 border-[#1e2430]' : 'bg-gray-50 border-gray-100'}`}>
                  <button
                    onClick={handleShareReport}
                    className={`flex items-center gap-2 px-7 py-3 border-2 rounded-2xl font-medium transition-all ${darkMode ? 'border-[#1e2430] text-gray-400 hover:bg-white/5' : 'border-gray-200 text-gray-500 hover:bg-white hover:border-teal-200'
                      }`}>
                    <Share2 size={18} className="text-gray-500" />
                    Share Report
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-teal-700 shadow-lg transition-all">
                    <Download size={18} />
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LiveMap;