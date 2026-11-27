import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MapPin, 
  Navigation, 
  ExternalLink, 
  Phone, 
  Star, 
  Clock, 
  Tag, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Compass, 
  Store, 
  Plus, 
  Minus, 
  Search, 
  Layers, 
  Globe2, 
  Check, 
  Route, 
  Sparkles,
  Info
} from 'lucide-react';
import { NearbyShop } from '../types';

interface NearbyShopsMapProps {
  shops: NearbyShop[];
  userCoords: { lat: number; lng: number } | null;
  locationName: string;
  selectedCity: string;
  selectedShopId?: string | null;
  searchQuery?: string;
  onSelectShop?: (shop: NearbyShop) => void;
  onGetDirections?: (shop: NearbyShop) => void;
  onSearchChange?: (q: string) => void;
  maxDistanceKm?: number;
  className?: string;
}

// Category Color Palette for Map Pins
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; dot: string; icon: string }> = {
  'Grocery': { bg: '#10b981', border: '#047857', text: '#ffffff', dot: 'bg-emerald-500', icon: '🛒' },
  'Clothing': { bg: '#6366f1', border: '#4338ca', text: '#ffffff', dot: 'bg-indigo-500', icon: '👕' },
  'Food & Health': { bg: '#f43f5e', border: '#be123c', text: '#ffffff', dot: 'bg-rose-500', icon: '🥗' },
  'Beauty & Personal Care': { bg: '#a855f7', border: '#7e22ce', text: '#ffffff', dot: 'bg-purple-500', icon: '✨' },
  'Electronics': { bg: '#f59e0b', border: '#b45309', text: '#ffffff', dot: 'bg-amber-500', icon: '⚡' },
  'General': { bg: '#64748b', border: '#334155', text: '#ffffff', dot: 'bg-slate-500', icon: '🏪' },
  'Other': { bg: '#64748b', border: '#334155', text: '#ffffff', dot: 'bg-slate-500', icon: '🏪' }
};

export const NearbyShopsMap: React.FC<NearbyShopsMapProps> = ({
  shops,
  userCoords,
  locationName,
  selectedCity,
  selectedShopId,
  searchQuery = '',
  onSelectShop,
  onGetDirections,
  onSearchChange,
  maxDistanceKm = 10,
  className = ''
}) => {
  const [activeShop, setActiveShop] = useState<NearbyShop | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRadius, setShowRadius] = useState(true);
  
  // Map View Mode: 'google' (Live Google Maps) vs 'pins' (Interactive Store Pin Radar)
  const [mapViewMode, setMapViewMode] = useState<'google' | 'pins'>('google');
  const [googleMapLayer, setGoogleMapLayer] = useState<'m' | 'k' | 'p'>('m'); // m = road map, k = satellite, p = terrain
  const [localMapSearch, setLocalMapSearch] = useState('');
  
  // Pan and Zoom State for Pin radar
  const [zoom, setZoom] = useState<number>(14);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute effective center coordinates
  const defaultCenter = useMemo(() => {
    if (userCoords && userCoords.lat && userCoords.lng) return userCoords;
    if (shops.length > 0 && shops[0].lat && shops[0].lng) {
      return { lat: shops[0].lat, lng: shops[0].lng };
    }
    const cityCoords: Record<string, { lat: number; lng: number }> = {
      'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Delhi': { lat: 28.6139, lng: 77.2090 },
      'Bengaluru': { lat: 12.9716, lng: 77.5946 },
      'Surat': { lat: 21.1702, lng: 72.8311 },
      'Pune': { lat: 18.5204, lng: 73.8567 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Kolkata': { lat: 22.5726, lng: 88.3639 },
      'Jaipur': { lat: 26.9124, lng: 75.7873 },
      'Vadodara': { lat: 22.3072, lng: 73.1812 },
      'Rajkot': { lat: 22.3039, lng: 70.8022 }
    };
    return cityCoords[selectedCity] || { lat: 23.0225, lng: 72.5714 };
  }, [userCoords, shops, selectedCity]);

  // Valid shops with latitude and longitude
  const validShops = useMemo(() => {
    return shops.filter(s => s.lat !== undefined && s.lng !== undefined);
  }, [shops]);

  // Sync externally selected shop
  useEffect(() => {
    if (selectedShopId) {
      const match = shops.find(s => s.id === selectedShopId);
      if (match) {
        setActiveShop(match);
        if (match.lat && match.lng) {
          const dLat = match.lat - defaultCenter.lat;
          const dLng = match.lng - defaultCenter.lng;
          const scale = Math.pow(2, zoom - 12) * 1200;
          setPanOffset({
            x: -(dLng * scale),
            y: (dLat * scale)
          });
        }
      }
    }
  }, [selectedShopId, shops, defaultCenter, zoom]);

  // Reset when city changes
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(14);
    setActiveShop(null);
  }, [selectedCity, defaultCenter]);

  // Mouse / Touch Dragging Handlers for Pin Radar
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { 
        x: e.touches[0].clientX - panOffset.x, 
        y: e.touches[0].clientY - panOffset.y 
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPanOffset({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(18, prev + 1));
    } else {
      setZoom(prev => Math.max(10, prev - 1));
    }
  };

  const handleRecenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(14);
    setActiveShop(null);
    setLocalMapSearch('');
  };

  const handleMarkerClick = (shop: NearbyShop, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveShop(shop);
    if (onSelectShop) {
      onSelectShop(shop);
    }
  };

  const handleDirections = (shop: NearbyShop) => {
    if (onGetDirections) {
      onGetDirections(shop);
    } else {
      const q = shop.lat && shop.lng 
        ? `${shop.lat},${shop.lng}`
        : encodeURIComponent(`${shop.name} ${shop.address} ${shop.city || ''}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
    }
  };

  const openGoogleMapsSearch = (term: string) => {
    const q = encodeURIComponent(`${term} in ${selectedCity}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  };

  // Google Map Embed Query Calculation
  const googleMapEmbedUrl = useMemo(() => {
    let queryParam = '';
    if (activeShop) {
      queryParam = activeShop.lat && activeShop.lng
        ? `${activeShop.lat},${activeShop.lng}`
        : `${activeShop.name}, ${activeShop.address}, ${selectedCity}`;
    } else if (localMapSearch.trim()) {
      queryParam = `${localMapSearch.trim()} in ${selectedCity}`;
    } else if (searchQuery.trim()) {
      queryParam = `${searchQuery.trim()} shops in ${selectedCity}`;
    } else if (userCoords && userCoords.lat && userCoords.lng) {
      queryParam = `${userCoords.lat},${userCoords.lng}`;
    } else {
      queryParam = `shops in ${selectedCity}`;
    }

    const encoded = encodeURIComponent(queryParam);
    return `https://maps.google.com/maps?q=${encoded}&t=${googleMapLayer}&z=${zoom}&ie=UTF8&iwloc=&output=embed`;
  }, [activeShop, localMapSearch, searchQuery, userCoords, selectedCity, googleMapLayer, zoom]);

  // Mercator-like projection calculation for screen coordinates
  const scale = useMemo(() => Math.pow(2, zoom - 12) * 1100, [zoom]);

  return (
    <div 
      id="nearby-shops-interactive-map"
      className={`rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : `w-full ${className || 'h-[480px] sm:h-[540px]'}`
      }`}
    >
      {/* 1. TOP CONTROLS & GOOGLE MAPS SWITCHER */}
      <div className="p-3 sm:px-4 sm:py-3 bg-zinc-50/95 backdrop-blur-md border-b border-zinc-200 flex items-center justify-between gap-3 flex-wrap z-20">
        
        {/* Left: Google Map Branding & Location */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-zinc-900 flex items-center gap-1.5">
                <span>Google Map Store Finder</span>
                <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 font-bold text-[10px]">
                  LIVE
                </span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 truncate max-w-[200px] sm:max-w-[280px]">
              {activeShop ? `Selected: ${activeShop.name}` : `Area: ${locationName}`}
            </p>
          </div>
        </div>

        {/* Center: Find Shop Search on Map */}
        <div className="flex-1 max-w-xs min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder={`Find shop or brand in ${selectedCity}...`}
            value={localMapSearch}
            onChange={(e) => {
              setLocalMapSearch(e.target.value);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && localMapSearch.trim()) {
                e.preventDefault();
                setActiveShop(null);
              }
            }}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-emerald-500 shadow-xs"
          />
          {localMapSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalMapSearch('');
                if (onSearchChange) onSearchChange('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Mode & Layer Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          
          {/* Mode Switcher: Google Map vs Pin Radar */}
          <div className="flex items-center rounded-xl bg-zinc-200/80 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setMapViewMode('google')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mapViewMode === 'google'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>🗺️</span>
              <span>Google Map</span>
            </button>
            <button
              type="button"
              onClick={() => setMapViewMode('pins')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                mapViewMode === 'pins'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              <span>📍</span>
              <span>Pins Radar</span>
            </button>
          </div>

          {/* Layer Controls (When in Google Maps Mode) */}
          {mapViewMode === 'google' && (
            <div className="hidden sm:flex items-center rounded-xl bg-zinc-200/80 p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setGoogleMapLayer('m')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  googleMapLayer === 'm' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                }`}
              >
                Map
              </button>
              <button
                type="button"
                onClick={() => setGoogleMapLayer('k')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  googleMapLayer === 'k' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setGoogleMapLayer('p')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  googleMapLayer === 'p' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                }`}
              >
                Terrain
              </button>
            </div>
          )}

          {/* Recenter / Reset Button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
            title="Recenter map"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Recenter</span>
          </button>

          {/* Open in Google Maps External */}
          <button
            type="button"
            onClick={() => {
              if (activeShop) {
                handleDirections(activeShop);
              } else {
                openGoogleMapsSearch(localMapSearch || searchQuery || 'shops');
              }
            }}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
            title="Open in Google Maps"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Open in Maps</span>
          </button>

          {/* Expand Fullscreen */}
          <button
            type="button"
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1.5 rounded-xl bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 transition-colors cursor-pointer shadow-xs"
            title={isExpanded ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. MAP VIEW BODY */}
      <div className="relative flex-1 w-full h-full min-h-[340px] bg-zinc-100 overflow-hidden select-none">
        
        {/* MODE A: REAL GOOGLE MAPS EMBED VIEW */}
        {mapViewMode === 'google' && (
          <div className="relative w-full h-full">
            <iframe
              title={`Google Map - ${selectedCity}`}
              src={googleMapEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
            />

            {/* Floating Store Quick Chips on Google Map */}
            <div className="absolute top-3 left-3 right-3 sm:right-auto z-10 flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none pointer-events-auto">
              <span className="px-2.5 py-1 rounded-xl bg-zinc-900/85 text-white font-bold text-[11px] backdrop-blur-md shadow-md flex items-center gap-1 flex-shrink-0">
                <span>📍</span>
                <span>Select Store to Locate:</span>
              </span>
              {shops.slice(0, 8).map((shop) => {
                const isSelected = activeShop?.id === shop.id;
                return (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => {
                      setActiveShop(shop);
                      if (onSelectShop) onSelectShop(shop);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-md cursor-pointer flex-shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-600 text-white ring-2 ring-white'
                        : 'bg-white/95 hover:bg-white text-zinc-800 border border-zinc-200'
                    }`}
                  >
                    <span>{shop.name}</span>
                    <span className="text-[10px] opacity-75">
                      ({shop.distanceKm !== undefined ? `${shop.distanceKm}km` : shop.distance})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE B: INTERACTIVE PINS RADAR MAP */}
        {mapViewMode === 'pins' && (
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className={`relative w-full h-full overflow-hidden select-none cursor-grab bg-emerald-50/40 ${
              isDragging ? 'cursor-grabbing' : ''
            }`}
          >
            {/* Street Grid Graphic Layer */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="street-grid" width="120" height="120" patternUnits="userSpaceOnUse">
                    <path d="M 0 40 L 120 40 M 40 0 L 40 120 M 0 80 L 120 80 M 80 0 L 80 120" fill="none" stroke="#10b981" strokeWidth="1" strokeOpacity="0.2" />
                    <path d="M 0 0 L 120 120 M 120 0 L 0 120" fill="none" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.15" />
                    <circle cx="40" cy="40" r="3" fill="#10b981" fillOpacity="0.25" />
                    <circle cx="80" cy="80" r="3" fill="#10b981" fillOpacity="0.25" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#street-grid)" />
              </svg>
            </div>

            {/* Dynamic Canvas Container transformed by Pan & Zoom */}
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`
              }}
            >
              {/* Concentric Search Distance Rings */}
              {showRadius && (
                <div className="absolute flex items-center justify-center pointer-events-none">
                  <div 
                    style={{ 
                      width: `${Math.min(750, maxDistanceKm * 34 * (zoom / 13))}px`, 
                      height: `${Math.min(750, maxDistanceKm * 34 * (zoom / 13))}px` 
                    }}
                    className="rounded-full border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center transition-all duration-300 relative"
                  >
                    <span className="text-[10px] font-mono font-bold text-emerald-800 absolute -top-5 bg-white/90 px-2 py-0.5 rounded-full border border-emerald-300 shadow-xs">
                      {maxDistanceKm} km search radius
                    </span>
                    <div className="w-2/3 h-2/3 rounded-full border border-emerald-500/20" />
                  </div>
                </div>
              )}

              {/* User Location Radar Center */}
              <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-auto group cursor-pointer">
                <div className="relative flex items-center justify-center">
                  <span className="w-12 h-12 rounded-full bg-emerald-500/20 animate-ping absolute" />
                  <span className="w-8 h-8 rounded-full bg-emerald-500/40 absolute" />
                  <div className="w-6 h-6 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-bold">
                    📍
                  </div>
                </div>
                <div className="mt-1.5 px-2 py-0.5 rounded-md bg-zinc-900/90 text-white text-[10px] font-bold backdrop-blur-xs whitespace-nowrap shadow-md">
                  You ({selectedCity})
                </div>
              </div>

              {/* Store Markers Positioned Geographically */}
              {validShops.map((shop) => {
                const isSelected = activeShop?.id === shop.id;
                const palette = CATEGORY_COLORS[shop.category] || CATEGORY_COLORS['General'];
                
                const dLat = (shop.lat! - defaultCenter.lat);
                const dLng = (shop.lng! - defaultCenter.lng);
                
                const x = dLng * scale;
                const y = -dLat * scale;

                return (
                  <div
                    key={shop.id}
                    style={{
                      transform: `translate(${x}px, ${y}px)`
                    }}
                    className="absolute pointer-events-auto z-30 transition-transform duration-200"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleMarkerClick(shop, e)}
                      className={`relative flex flex-col items-center group cursor-pointer transition-all duration-200 -translate-x-1/2 -translate-y-1/2 ${
                        isSelected ? 'scale-125 z-40' : 'hover:scale-115'
                      }`}
                    >
                      <div 
                        style={{ 
                          backgroundColor: palette.bg, 
                          borderColor: isSelected ? '#ffffff' : palette.border 
                        }}
                        className={`px-2 py-1 rounded-xl text-white text-[11px] font-bold shadow-lg border-2 flex items-center gap-1 transition-all ${
                          isSelected ? 'ring-4 ring-emerald-500/50 shadow-xl' : 'hover:shadow-md'
                        }`}
                      >
                        <span>{palette.icon}</span>
                        <span className="hidden sm:inline font-sans text-[10px] max-w-[85px] truncate text-white">
                          {shop.name}
                        </span>
                      </div>

                      <span className="mt-0.5 px-1.5 py-0.2 rounded-md bg-zinc-900/80 text-white text-[9px] font-medium backdrop-blur-xs">
                        {shop.distanceKm !== undefined ? `${shop.distanceKm} km` : shop.distance}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Floating Zoom & Pan Controls on the Right */}
            <div className="absolute right-4 bottom-4 z-40 flex flex-col gap-1 bg-white/95 backdrop-blur-md rounded-2xl p-1 border border-zinc-200 shadow-md">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(18, prev + 1))}
                className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="h-px bg-zinc-200 my-0.5" />
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(10, prev - 1))}
                className="p-2 rounded-xl hover:bg-zinc-100 text-zinc-700 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Selected Store Floating Inspection Card (Available in both modes) */}
        {activeShop && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-88 z-50 bg-white/98 backdrop-blur-md rounded-2xl border border-zinc-200 p-4 shadow-2xl animate-in slide-in-from-bottom-3 duration-200 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {activeShop.category}
                </span>
                <h4 className="font-bold text-sm text-zinc-900 mt-1">
                  {activeShop.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveShop(null)}
                className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer rounded-lg hover:bg-zinc-100"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <div className="flex items-center gap-1 font-bold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{activeShop.rating.toFixed(1)}</span>
              </div>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">
                {activeShop.distanceKm !== undefined ? `${activeShop.distanceKm} km away` : activeShop.distance}
              </span>
              {activeShop.area && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[100px]">{activeShop.area}</span>
                </>
              )}
            </div>

            <p className="text-xs text-zinc-600 line-clamp-2">
              {activeShop.address}
            </p>

            {activeShop.timing && (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>{activeShop.timing}</span>
              </div>
            )}

            {activeShop.offers && (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>{activeShop.offers}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {activeShop.phone && (
                <a
                  href={`tel:${activeShop.phone}`}
                  className="flex-1 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => handleDirections(activeShop)}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Directions</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. MAP FOOTER LEGEND & QUICK INFO */}
      <div className="p-2.5 sm:px-4 sm:py-2 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-[11px]">
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
            Store Types:
          </span>
          {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([cat, val]) => (
            <div key={cat} className="flex items-center gap-1.5 text-zinc-600">
              <span className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
              <span>{cat}</span>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 flex-shrink-0">
          <Info className="w-3 h-3 text-emerald-600" />
          <span>Switch modes • Click any store to pinpoint & get Google Maps directions</span>
        </div>
      </div>
    </div>
  );
};
