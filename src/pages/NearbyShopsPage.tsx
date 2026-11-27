import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Star, 
  Search, 
  Building2, 
  Phone, 
  ExternalLink, 
  Compass, 
  CheckCircle2, 
  AlertCircle,
  ShoppingBag,
  Plus,
  SlidersHorizontal,
  Clock,
  Tag,
  Store,
  Sparkles,
  MapPinned,
  ChevronDown,
  X,
  Trash2,
  Bookmark,
  Share2,
  Check,
  Building,
  Globe2,
  Layers,
  Map as MapIcon,
  LayoutGrid,
  Columns
} from 'lucide-react';
import { NearbyShop, ProductCategory } from '../types';
import { 
  api, 
  getStoredUserLocation, 
  saveStoredUserLocation, 
  calculateDistanceKm 
} from '../services/api';
import { NearbyShopsMap } from '../components/NearbyShopsMap';

interface NearbyShopsPageProps {
  onNavigateToShopping?: () => void;
}

// Known cities coordinates map for accurate distance calculation
const KNOWN_CITIES: Record<string, { lat: number; lng: number; state: string; popularAreas: string[] }> = {
  'Ahmedabad': { 
    lat: 23.0225, 
    lng: 72.5714, 
    state: 'Gujarat', 
    popularAreas: ['Vastrapur', 'Navrangpura', 'Satellite', 'Bodakdev', 'Thaltej', 'SG Highway'] 
  },
  'Surat': { 
    lat: 21.1702, 
    lng: 72.8311, 
    state: 'Gujarat', 
    popularAreas: ['Adajan', 'Ring Road', 'Varachha', 'Dumas Road', 'Vesu', 'Piplod'] 
  },
  'Mumbai': { 
    lat: 19.0760, 
    lng: 72.8777, 
    state: 'Maharashtra', 
    popularAreas: ['Bandra West', 'Andheri', 'Khar West', 'Santacruz', 'Juhu', 'Colaba'] 
  },
  'Delhi': { 
    lat: 28.6139, 
    lng: 77.2090, 
    state: 'Delhi NCR', 
    popularAreas: ['Connaught Place', 'Khan Market', 'South Extension', 'Lajpat Nagar', 'Karol Bagh'] 
  },
  'Bengaluru': { 
    lat: 12.9716, 
    lng: 77.5946, 
    state: 'Karnataka', 
    popularAreas: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'MG Road'] 
  },
  'Pune': { 
    lat: 18.5204, 
    lng: 73.8567, 
    state: 'Maharashtra', 
    popularAreas: ['FC Road', 'Shivaji Nagar', 'Kothrud', 'Viman Nagar', 'Baner', 'SB Road'] 
  },
  'Jaipur': { 
    lat: 26.9124, 
    lng: 75.7873, 
    state: 'Rajasthan', 
    popularAreas: ['MI Road', 'Malviya Nagar', 'C-Scheme', 'Mansarovar', 'Vaishali Nagar'] 
  },
  'Hyderabad': { 
    lat: 17.3850, 
    lng: 78.4867, 
    state: 'Telangana', 
    popularAreas: ['Banjara Hills', 'Jubilee Hills', 'Hitec City', 'Gachibowli', 'Madhapur'] 
  },
  'Vadodara': { 
    lat: 22.3072, 
    lng: 73.1812, 
    state: 'Gujarat', 
    popularAreas: ['Alkapuri', 'Sayajigunj', 'Fatehgunj', 'Vasna Road', 'Manjalpur'] 
  },
  'Rajkot': { 
    lat: 22.3039, 
    lng: 70.8022, 
    state: 'Gujarat', 
    popularAreas: ['Yagnik Road', 'Kalawad Road', '150 Feet Ring Road', 'Amin Marg'] 
  }
};

const POPULAR_CITY_CHIPS = [
  'Ahmedabad',
  'Surat',
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Pune',
  'Jaipur',
  'Hyderabad',
  'Vadodara',
  'Rajkot'
];

export const NearbyShopsPage: React.FC<NearbyShopsPageProps> = ({
  onNavigateToShopping
}) => {
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'name'>('distance');

  // Map & View Mode State
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'grid'>('split');
  const [selectedShopOnMap, setSelectedShopOnMap] = useState<NearbyShop | null>(null);
  const mapSectionRef = useRef<HTMLDivElement>(null);

  // City State
  const [selectedCity, setSelectedCity] = useState<string>(() => {
    return localStorage.getItem('smartreceipt_user_city') || 'Ahmedabad';
  });
  const [cityInputText, setCityInputText] = useState<string>('');
  const [isCustomCityActive, setIsCustomCityActive] = useState(false);

  // Location & Coordinates State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('Ahmedabad, Gujarat');
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isAddShopModalOpen, setIsAddShopModalOpen] = useState(false);

  // Custom Location Form State
  const [customLocName, setCustomLocName] = useState('');
  const [customLocAddress, setCustomLocAddress] = useState('');
  const [customLocCity, setCustomLocCity] = useState('');

  // Add Shop Form State
  const [newShopName, setNewShopName] = useState('');
  const [newShopCategory, setNewShopCategory] = useState<ProductCategory>('Grocery');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopArea, setNewShopArea] = useState('');
  const [newShopCity, setNewShopCity] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopTiming, setNewShopTiming] = useState('09:00 AM - 09:30 PM');
  const [newShopOffers, setNewShopOffers] = useState('');
  const [newShopInStock, setNewShopInStock] = useState('');
  const [newShopRating, setNewShopRating] = useState<number>(4.6);
  const [newShopPriceRange, setNewShopPriceRange] = useState<'₹' | '₹₹' | '₹₹₹'>('₹₹');

  const categories = ['All', 'Clothing', 'Grocery', 'Food & Health', 'Beauty & Personal Care', 'Electronics'];

  // Initialize saved location or city coordinates
  useEffect(() => {
    const saved = getStoredUserLocation();
    const savedCity = localStorage.getItem('smartreceipt_user_city') || 'Ahmedabad';
    setSelectedCity(savedCity);
    setNewShopCity(savedCity);

    if (saved && saved.lat && saved.lng) {
      setLocationName(saved.name || saved.address);
      setUserCoords({ lat: saved.lat, lng: saved.lng });
    } else if (KNOWN_CITIES[savedCity]) {
      const cityData = KNOWN_CITIES[savedCity];
      setUserCoords({ lat: cityData.lat, lng: cityData.lng });
      setLocationName(`${savedCity}, ${cityData.state}`);
    } else {
      setUserCoords({ lat: 23.0225, lng: 72.5714 });
      setLocationName('Ahmedabad, Gujarat');
    }
  }, []);

  // Fetch shops when city, category, search, or distance params change
  useEffect(() => {
    loadShops();
  }, [selectedCity, selectedCategory, maxDistance, sortBy, userCoords]);

  const loadShops = async (coords?: { lat: number; lng: number }, query?: string, cityOverride?: string) => {
    setLoading(true);
    const activeCoords = coords || userCoords;
    const activeCity = cityOverride !== undefined ? cityOverride : selectedCity;
    try {
      const results = await api.getNearbyShops({
        latitude: activeCoords?.lat,
        longitude: activeCoords?.lng,
        city: activeCity,
        category: selectedCategory,
        query: query !== undefined ? query : searchQuery,
        maxDistanceKm: maxDistance > 0 ? maxDistance : undefined,
        sortBy
      });
      setShops(results);
    } catch (e) {
      console.error('Error loading nearby shops:', e);
    } finally {
      setLoading(false);
    }
  };

  // Switch or Enter City
  const handleCityChange = (cityName: string) => {
    const cleanCity = cityName.trim();
    if (!cleanCity) return;

    setSelectedCity(cleanCity);
    localStorage.setItem('smartreceipt_user_city', cleanCity);
    setNewShopCity(cleanCity);
    setCityInputText('');

    // Determine coordinates for the city
    let newCoords = { lat: 23.0225, lng: 72.5714 };
    let newLocTitle = `${cleanCity}`;

    if (KNOWN_CITIES[cleanCity]) {
      const cityData = KNOWN_CITIES[cleanCity];
      newCoords = { lat: cityData.lat, lng: cityData.lng };
      newLocTitle = `${cleanCity}, ${cityData.state}`;
    } else {
      // Approximate coordinate variation based on city string hash for realistic distance calculation
      const hash = cleanCity.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const pseudoLat = 20.0 + ((hash % 100) / 10);
      const pseudoLng = 73.0 + (((hash * 7) % 100) / 10);
      newCoords = { lat: pseudoLat, lng: pseudoLng };
    }

    setUserCoords(newCoords);
    setLocationName(newLocTitle);
    saveStoredUserLocation({ name: newLocTitle, address: cleanCity, lat: newCoords.lat, lng: newCoords.lng });
    setLocationStatus(`Switched city to "${cleanCity}". Showing shops in this city.`);

    loadShops(newCoords, undefined, cleanCity);
  };

  const handleCityInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cityInputText.trim()) {
      handleCityChange(cityInputText.trim());
    }
  };

  // GPS Locate
  const handleRequestGPS = () => {
    setLocationStatus('Acquiring precise GPS coordinates from your device...');
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        const locTitle = `Live GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`;
        setLocationName(locTitle);
        saveStoredUserLocation({ name: locTitle, address: 'Live Geolocation Pin', lat: coords.lat, lng: coords.lng });
        setLocationStatus('GPS Pin Acquired! Distance & driving estimates calculated from your live spot.');
        loadShops(coords);
      },
      () => {
        setLocationStatus('GPS permission was denied. Continuing with selected city.');
        loadShops();
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  };

  // Submit custom location address from modal
  const handleSaveCustomLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const city = customLocCity.trim() || selectedCity;
    const area = customLocName.trim() || customLocAddress.trim();
    if (!area && !city) return;

    const fullTitle = `${area ? area + ', ' : ''}${city}`;
    handleCityChange(city);
    setLocationName(fullTitle);
    setIsLocationModalOpen(false);
    setCustomLocName('');
    setCustomLocAddress('');
    setCustomLocCity('');
  };

  // Submit Add New Shop
  const handleAddNewShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim() || !newShopAddress.trim()) return;

    const targetCity = (newShopCity.trim() || selectedCity || 'Ahmedabad');
    const inStockArr = newShopInStock
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Calculate realistic distance relative to current city coordinates
    const baseLat = userCoords?.lat || 23.036;
    const baseLng = userCoords?.lng || 72.529;
    const shopLat = baseLat + (Math.random() * 0.015 - 0.007);
    const shopLng = baseLng + (Math.random() * 0.015 - 0.007);
    const dist = userCoords 
      ? calculateDistanceKm(userCoords.lat, userCoords.lng, shopLat, shopLng)
      : 0.8;

    try {
      const addedShop = await api.addCustomShop({
        name: newShopName.trim(),
        category: newShopCategory,
        address: newShopAddress.trim(),
        area: newShopArea.trim() || 'Local Area',
        city: targetCity,
        phone: newShopPhone.trim() || undefined,
        timing: newShopTiming.trim() || '09:00 AM - 09:30 PM',
        offers: newShopOffers.trim() || undefined,
        inStockItems: inStockArr.length > 0 ? inStockArr : undefined,
        rating: newShopRating,
        priceRange: newShopPriceRange,
        lat: shopLat,
        lng: shopLng,
        distanceKm: dist,
        distance: `${dist} km away`
      });

      // If added in the current city or all cities, prepend to active list
      if (targetCity.toLowerCase() === selectedCity.toLowerCase() || selectedCity.toLowerCase() === 'all') {
        setShops(prev => [addedShop, ...prev]);
      } else {
        // Switch to the city of the new shop so user immediately sees it
        handleCityChange(targetCity);
      }

      setIsAddShopModalOpen(false);
      setLocationStatus(`Added "${newShopName.trim()}" in ${targetCity}! Visible in this Nearby Shops menu.`);

      // Reset form
      setNewShopName('');
      setNewShopAddress('');
      setNewShopArea('');
      setNewShopPhone('');
      setNewShopOffers('');
      setNewShopInStock('');
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Custom Shop
  const handleDeleteCustomShop = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove "${name}" from this shops menu?`)) {
      await api.deleteCustomShop(id);
      setShops(prev => prev.filter(s => s.id !== id));
      setLocationStatus(`Removed "${name}" from your shops list.`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadShops(userCoords || undefined, searchQuery);
  };

  const openGoogleMaps = (shop: NearbyShop) => {
    const q = shop.lat && shop.lng 
      ? `${shop.lat},${shop.lng}`
      : encodeURIComponent(`${shop.name} ${shop.address} ${shop.city || ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. HEADER WITH ACTIVE CITY BADGE & ACTION CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-zinc-900 dark:text-zinc-100">
                  Nearby Shops & Stores
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {shops.length} in {selectedCity}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                Browse verified local retail stores, grocery marts, clothing outlets, and pharmacies exclusively in this menu.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Location / City Details Button */}
          <button
            type="button"
            onClick={() => setIsLocationModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MapPinned className="w-4 h-4 text-emerald-600" />
            <span className="truncate max-w-[140px] sm:max-w-[180px]">{locationName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* GPS Pin */}
          <button
            type="button"
            onClick={handleRequestGPS}
            className="px-3.5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Use live device GPS coordinates"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Use GPS</span>
          </button>

          {/* Add Shop Button */}
          <button
            type="button"
            onClick={() => {
              setNewShopCity(selectedCity);
              setIsAddShopModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Shop in {selectedCity}</span>
          </button>
        </div>
      </div>

      {/* 2. DEDICATED CITY NAME ENTRY & QUICK CITY SELECTOR BAR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* City Search Form */}
          <form onSubmit={handleCityInputSubmit} className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Building className="w-4 h-4 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter city name (e.g. Surat, Mumbai, Delhi, Bengaluru, Pune, Jaipur, Rajkot...)"
                value={cityInputText}
                onChange={(e) => setCityInputText(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={!cityInputText.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-colors cursor-pointer flex-shrink-0"
            >
              Set City
            </button>
          </form>

          {/* Active City indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-zinc-400">Current City:</span>
            <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{selectedCity}</span>
            </span>
          </div>
        </div>

        {/* Quick Popular City Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
            <Globe2 className="w-3 h-3" />
            <span>Popular Cities:</span>
          </span>
          {POPULAR_CITY_CHIPS.map((c) => {
            const isActive = selectedCity.toLowerCase() === c.toLowerCase();
            return (
              <button
                key={c}
                type="button"
                onClick={() => handleCityChange(c)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {c}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => handleCityChange('All')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCity.toLowerCase() === 'all'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            All Cities
          </button>
        </div>
      </div>

      {/* 3. STATUS NOTIFICATION BANNER */}
      {locationStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{locationStatus}</span>
          </div>
          <button 
            type="button"
            onClick={() => setLocationStatus(null)}
            className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. PRODUCT & STORE SEARCH WITH CATEGORY AND RADIUS FILTERS */}
      <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search products (e.g. 'jeans', 'milk', 'oil', 'rice') or stores in ${selectedCity}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Radius Distance Select */}
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value={1}>Within 1 km</option>
              <option value={3}>Within 3 km</option>
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={50}>Any Distance</option>
            </select>

            {/* Sort By Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="distance">Nearest First</option>
              <option value="rating">Top Rated</option>
              <option value="name">Alphabetical</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs transition-colors cursor-pointer flex-shrink-0"
            >
              Search
            </button>
          </div>
        </form>

        {/* Category Filter Pills & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex-shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Split Map & Store Cards"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Interactive Full Map"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map Only</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
              title="Grid of Store Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE MAP SECTION (WHEN SPLIT OR MAP MODE) */}
      {(viewMode === 'split' || viewMode === 'map') && (
        <div ref={mapSectionRef} className="space-y-2 animate-in fade-in duration-300">
          <NearbyShopsMap
            shops={shops}
            userCoords={userCoords}
            locationName={locationName}
            selectedCity={selectedCity}
            selectedShopId={selectedShopOnMap?.id}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              loadShops(userCoords || undefined, q);
            }}
            onSelectShop={(shop) => {
              setSelectedShopOnMap(shop);
            }}
            onGetDirections={(shop) => openGoogleMaps(shop)}
            maxDistanceKm={maxDistance}
            className={viewMode === 'map' ? 'h-[540px] sm:h-[600px]' : 'h-[440px] sm:h-[500px]'}
          />
        </div>
      )}

      {/* 6. SHOPS LIST / GRID */}
      {viewMode !== 'map' && (
        <>
          {loading ? (
            <div className="p-16 text-center text-xs text-zinc-400">
              Locating verified shops and retail marts in {selectedCity}...
            </div>
          ) : shops.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  No shops found in {selectedCity} with current filters
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  Try switching your city, expanding the search distance radius, or register your favorite local mart for this city.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setMaxDistance(50)}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  Expand Radius
                </button>
                <button
                  type="button"
                  onClick={() => handleCityChange('Ahmedabad')}
                  className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  View Ahmedabad Stores
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewShopCity(selectedCity);
                    setIsAddShopModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  + Register Shop in {selectedCity}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {shops.map((shop) => {
                const isSelected = selectedShopOnMap?.id === shop.id;
                return (
                  <div
                    key={shop.id}
                    className={`p-5 rounded-3xl bg-white dark:bg-zinc-900 border transition-all flex flex-col justify-between group relative ${
                      isSelected 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md' 
                        : 'border-zinc-200 dark:border-zinc-800 shadow-xs hover:shadow-md hover:border-emerald-500/40'
                    }`}
                  >
                    {/* Custom Added Badge & Delete Control */}
                    {shop.isCustomAdded && (
                      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Added by You
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomShop(shop.id, shop.name)}
                          className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove shop"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div>
                      {/* Category & Rating Row */}
                      <div className="flex items-center justify-between gap-2 pr-16 mb-2">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {shop.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{shop.rating.toFixed(1)}</span>
                          {shop.priceRange && (
                            <span className="text-zinc-400 ml-1 font-normal">{shop.priceRange}</span>
                          )}
                        </div>
                      </div>

                      {/* Shop Name */}
                      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {shop.name}
                      </h3>

                      {/* Distance, Area & City Badge */}
                      <div className="flex items-center gap-2 mt-1 text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex-wrap">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>
                            {shop.distanceKm !== undefined ? `${shop.distanceKm} km away` : shop.distance || 'Nearby'}
                          </span>
                        </div>
                        {shop.area && (
                          <span className="text-zinc-400 font-normal">• {shop.area}</span>
                        )}
                        {shop.city && (
                          <span className="text-zinc-500 font-medium">({shop.city})</span>
                        )}
                      </div>

                      {/* Address */}
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                        {shop.address}
                      </p>

                      {/* Timing */}
                      {shop.timing && (
                        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <Clock className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                          <span>{shop.timing}</span>
                        </div>
                      )}

                      {/* Special Discount / Offer Badge */}
                      {shop.offers && (
                        <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                          <Tag className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-600" />
                          <span>{shop.offers}</span>
                        </div>
                      )}

                      {/* In Stock Highlights */}
                      {shop.inStockItems && shop.inStockItems.length > 0 && (
                        <div className="mt-3">
                          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                            Popular In Stock
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {shop.inStockItems.slice(0, 4).map((item, idx) => (
                              <span 
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[10px] bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                              >
                                {item}
                              </span>
                            ))}
                            {shop.inStockItems.length > 4 && (
                              <span className="text-[10px] text-zinc-400 self-center">
                                +{shop.inStockItems.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {shop.phone ? (
                          <a
                            href={`tel:${shop.phone}`}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1 transition-colors"
                            title={`Call ${shop.name}`}
                          >
                            <Phone className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="hidden sm:inline">Call</span>
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedShopOnMap(shop);
                            if (viewMode === 'grid') setViewMode('split');
                            setTimeout(() => {
                              mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }, 50);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                          }`}
                          title="Show pin on map"
                        >
                          <MapIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Pin</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onNavigateToShopping && (
                          <button
                            type="button"
                            onClick={onNavigateToShopping}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Add to Shopping List"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Planner</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openGoogleMaps(shop)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shadow-emerald-600/20"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Directions</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: ADD / CHANGE LOCATION */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <MapPinned className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Set Your City & Location
                  </h3>
                  <p className="text-[11px] text-zinc-500">Find shops & calculate driving distance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick GPS button */}
            <button
              type="button"
              onClick={() => {
                handleRequestGPS();
                setIsLocationModalOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
            >
              <Navigation className="w-4 h-4" />
              <span>Use Live Device GPS Coordinates</span>
            </button>

            {/* Preset City Areas */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Popular Cities
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POPULAR_CITY_CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      handleCityChange(c);
                      setIsLocationModalOpen(false);
                    }}
                    className={`p-2.5 text-left rounded-xl border text-xs font-semibold transition-colors cursor-pointer truncate ${
                      selectedCity.toLowerCase() === c.toLowerCase()
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                        : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    📍 {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Location Address Input */}
            <form onSubmit={handleSaveCustomLocation} className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Or Enter Custom Area & City
              </label>
              <input
                type="text"
                placeholder="City Name (e.g. Surat, Mumbai, Bengaluru, Delhi, Rajkot)"
                value={customLocCity}
                onChange={(e) => setCustomLocCity(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 font-medium"
              />
              <input
                type="text"
                placeholder="Area or Locality (e.g. Ring Road, Bandra, Koramangala)"
                value={customLocName}
                onChange={(e) => setCustomLocName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs transition-colors cursor-pointer"
              >
                Apply Custom Location
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD NEW SHOP IN CURRENT CITY */}
      {isAddShopModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Register New Local Shop
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Add store to this Nearby Shops menu in {newShopCity || selectedCity}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddShopModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewShop} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Shop / Store Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Royal Organic Mart, Cotton Republic"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={newShopCategory}
                    onChange={(e) => setNewShopCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Food & Health">Food & Health</option>
                    <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Home & Household">Home & Household</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Price Tier
                  </label>
                  <select
                    value={newShopPriceRange}
                    onChange={(e) => setNewShopPriceRange(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="₹">₹ - Budget / Wholesale</option>
                    <option value="₹₹">₹₹ - Moderate / Retail</option>
                    <option value="₹₹₹">₹₹₹ - Premium / Luxury</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Address & Street *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop 4, Galaxy Complex, Near Market Circle"
                  value={newShopAddress}
                  onChange={(e) => setNewShopAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    City Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Surat, Ahmedabad, Mumbai"
                    value={newShopCity}
                    onChange={(e) => setNewShopCity(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Area / Locality
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ring Road, Adajan"
                    value={newShopArea}
                    onChange={(e) => setNewShopArea(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newShopPhone}
                    onChange={(e) => setNewShopPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    placeholder="09:00 AM - 09:30 PM"
                    value={newShopTiming}
                    onChange={(e) => setNewShopTiming(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  In-Stock Products (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Basmati Rice, Desi Paneer, Sunflower Oil, Whole Wheat Flour"
                  value={newShopInStock}
                  onChange={(e) => setNewShopInStock(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  Special Offers / Discounts (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 10% discount on monthly family rations"
                  value={newShopOffers}
                  onChange={(e) => setNewShopOffers(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddShopModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-colors cursor-pointer"
                >
                  Register Shop in {newShopCity || selectedCity}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
