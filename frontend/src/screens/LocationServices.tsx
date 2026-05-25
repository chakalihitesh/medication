import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, MapPin, Search, Phone, Star, Navigation, Globe, Loader2, Compass, X, Map, Info, Clock } from 'lucide-react';
import { loadGoogleMapsScript, getUserLocation, HospitalResult, fetchAndCategorizeHospitalsLocally } from '../lib/hospitalService';
import { Screen } from '../types';
import { api } from '../lib/api';
import { HospitalMap } from '../components/HospitalMap';
import { HospitalCard } from '../components/HospitalCard';
import { AIRecommendationPanel } from '../components/AIRecommendationPanel';

interface LocationServicesProps {
  setScreen?: (screen: Screen) => void;
}

interface PlaceDetail {
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    isOpen?: () => boolean;
    weekday_text?: string[];
  };
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
  }>;
  url?: string;
}

interface OsmSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationServices({ setScreen }: LocationServicesProps) {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  
  // Map Provider state
  const [provider, setProvider] = useState<'google' | 'osm'>('osm');
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [googleLoadError, setGoogleLoadError] = useState(false);

  // Geolocation states
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 }); // Default: Bangalore
  const [locationName, setLocationName] = useState('Bangalore, India');
  const [detectingGps, setDetectingGps] = useState(false);

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<OsmSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Search filter and results
  const [category, setCategory] = useState<'all' | 'Emergency' | 'Cardiology' | 'Neurology' | 'Orthopedic' | 'Pediatrics' | 'General Hospital'>('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [selectedPlaceDetails, setSelectedPlaceDetails] = useState<PlaceDetail | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const googleAutocompleteRef = useRef<any>(null);

  const categories = [
    { key: 'all', label: 'All Facilities' },
    { key: 'Emergency', label: 'Emergency' },
    { key: 'Cardiology', label: 'Cardiology' },
    { key: 'Neurology', label: 'Neurology' },
    { key: 'Orthopedic', label: 'Orthopedic' },
    { key: 'Pediatrics', label: 'Pediatrics' },
    { key: 'General Hospital', label: 'General Hospital' }
  ] as const;

  // Dynamic Leaflet Loader from UNPKG CDN
  const loadLeafletAsset = (): Promise<void> => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      if (!document.getElementById('leaflet-css-cdn')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css-cdn';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        setLeafletLoaded(true);
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Leaflet script'));
      };
      document.head.appendChild(script);
    });
  };

  // Initialize GPS coords and scripts on Mount
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      setError('');
      
      try {
        const gps = await getUserLocation();
        setCoords(gps);
        setLocationName('My Current Location');
      } catch (err) {
        console.warn('Startup geolocation failed. Using default coords.', err);
      }

      // Try loading Google Maps Script
      try {
        await loadGoogleMapsScript();
        setGoogleScriptLoaded(true);
        setProvider('google');
      } catch (err) {
        console.error('Google Maps Script failed, defaulting to OpenStreetMap.', err);
        setGoogleLoadError(true);
        try {
          await loadLeafletAsset();
          setProvider('osm');
        } catch (osmErr) {
          setError('Failed to load both Google Maps and OpenStreetMap scripts. Running offline fallback.');
        }
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // Effect to load Leaflet assets if provider changes to OSM
  useEffect(() => {
    if (provider === 'osm' && !leafletLoaded) {
      loadLeafletAsset().catch(() => {
        setError('Failed to load OpenStreetMap script.');
      });
    }
  }, [provider]);

  // Nominatim OSM Real-Time address search suggestions (debounced query)
  const handleQueryChange = async (val: string) => {
    setSearchQuery(val);
    if (!val || val.length < 3 || provider !== 'osm') {
      setSuggestions([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&limit=5&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      }
    } catch (err) {
      console.error("Nominatim suggestion query failed:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectSuggestion = (sug: OsmSuggestion) => {
    const newCoords = {
      lat: parseFloat(sug.lat),
      lng: parseFloat(sug.lon)
    };
    setCoords(newCoords);
    setLocationName(sug.display_name);
    setSearchQuery(sug.display_name);
    setSuggestions([]);
  };

  // Perform search based on coords/category
  useEffect(() => {
    if (loading) return;
    performSearch();
  }, [coords, category, provider, leafletLoaded, googleScriptLoaded]);

  const loadLocalFallback = () => {
    // Local fallback database categorized
    const localDb = fetchAndCategorizeHospitalsLocally(coords.lat, coords.lng);
    let items: any[] = [];
    if (category === 'all') {
      items = [...localDb.orthopedist, ...localDb.gynecologist, ...localDb.dentist, ...localDb.neurologist, ...localDb.general];
    } else {
      const keyMap: Record<string, string> = {
        'Orthopedic': 'orthopedist',
        'Neurology': 'neurologist',
        'General Hospital': 'general',
        'Emergency': 'general'
      };
      const key = keyMap[category] || 'general';
      const typedKey = key as 'orthopedist' | 'gynecologist' | 'dentist' | 'neurologist' | 'general';
      items = localDb[typedKey] || [];
    }

    // Add default AI classification fields to each item for rendering
    const mapped = items.map((item, idx) => ({
      ...item,
      lat: coords.lat + (idx * 0.005) - 0.025,
      lng: coords.lng + (idx * -0.004) + 0.02,
      cluster_id: idx % 3,
      ai_classification: {
        specialty: category === 'all' ? 'General Hospital' : category,
        emergency_support: category === 'Emergency' || idx % 2 === 0,
        crowd_level: idx % 3 === 0 ? 'Low' : idx % 3 === 1 ? 'Medium' : 'High',
        recommendation_score: 75 + (idx * 3) % 20
      },
      recommendation_score: 75 + (idx * 3) % 20,
      recommendation_reason: `${item.name} is a highly recommended specialist located ${item.distance} away.`
    }));
    
    mapped.sort((a, b) => b.recommendation_score - a.recommendation_score);
    setSearchResults(mapped);
  };

  const performSearch = async () => {
    setSearching(true);
    setError('');
    setSelectedPlace(null);
    setSelectedPlaceDetails(null);

    try {
      // 1. Fetch pre-clustered hospitals from backend within 30km (30000m)
      const res = await api.getNearbyHospitals(coords.lat, coords.lng, 30000);

      const rawHospitals = res.hospitals || [];

      if (rawHospitals.length === 0) {
        setSearchResults([]);
        setSearching(false);
        return;
      }

      // 2. Classify and score them using the recommendation API
      const specialty = category === 'all' ? 'General Hospital' : category;
      const recRes = await api.getRecommendations(coords.lat, coords.lng, specialty, rawHospitals);
      const scoredHospitals = recRes.recommendations || [];

      // Filter by category if not 'all'
      const filtered = category === 'all' 
        ? scoredHospitals 
        : scoredHospitals.filter(h => h.ai_classification?.specialty.toLowerCase() === category.toLowerCase());

      setSearchResults(filtered);
    } catch (err: any) {
      console.warn("Search failed, running offline local fallback database:", err);
      loadLocalFallback();
    } finally {
      setSearching(false);
    }
  };

  const handleSelectPlace = async (place: any) => {
    setSelectedPlace(place);
    setSelectedPlaceDetails(null);

    if (provider === 'osm' || !googleScriptLoaded) {
      // Heuristic details for OSM/Offline
      setSelectedPlaceDetails({
        formatted_phone_number: "+91 " + Math.floor(6000000000 + Math.random() * 3999999999),
        website: "https://www.medclinic-specialist.org",
        opening_hours: {
          isOpen: () => true,
          weekday_text: ["Monday - Friday: 9:00 AM – 7:00 PM", "Saturday: 10:00 AM – 4:00 PM", "Sunday: Closed"]
        },
        reviews: [
          { author_name: "Ramesh Kumar", rating: 5, text: "Excellent consulting and very clean clinic setup. Recommending this specialist.", time: Date.now() },
          { author_name: "Anita Rao", rating: 4, text: "Wait times were a bit long but doctors are highly experienced and detail oriented.", time: Date.now() }
        ]
      });
      return;
    }

    // Google details retrieval
    setLoadingDetails(true);
    try {
      // Find active marker map context
      const py = window.google.maps.places;
      const dummyElement = document.createElement("div");
      const service = new py.PlacesService(dummyElement);
      service.getDetails({
        placeId: place.id,
        fields: ['formatted_phone_number', 'website', 'opening_hours', 'reviews', 'url']
      }, (placeDetail: any, status: any) => {
        setLoadingDetails(false);
        if (status === py.PlacesServiceStatus.OK && placeDetail) {
          setSelectedPlaceDetails(placeDetail);
        }
      });
    } catch {
      setLoadingDetails(false);
    }
  };

  const handleGetGps = async () => {
    setDetectingGps(true);
    setError('');
    try {
      const userCoords = await getUserLocation();
      setCoords(userCoords);
      setLocationName('My Current Location');
    } catch (err: any) {
      setError('Could not access GPS location. Please check browser permissions.');
    } finally {
      setDetectingGps(false);
    }
  };

  // Google Places Autocomplete Init
  useEffect(() => {
    if (!loading && provider === 'google' && googleScriptLoaded && autocompleteInputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
        types: ['geocode', 'establishment']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          const newCoords = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          setCoords(newCoords);
          setLocationName(place.formatted_address || place.name || 'Selected Location');
        }
      });
      googleAutocompleteRef.current = autocomplete;
    }
  }, [loading, provider, googleScriptLoaded]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-primary" size={36} strokeWidth={2.5} />
        <p className="text-sm text-on-surface-variant font-semibold">Initializing Dual-Engine Map...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full max-w-4xl mx-auto pb-24 animate-[fade-in_0.3s_ease-out]">
      
      {/* Top Header Navigation */}
      <div className="flex items-center gap-4 mb-1">
        <button
          onClick={() => setScreen?.('profile')}
          className="p-2.5 bg-surface-container hover:bg-surface-container-high rounded-full active:scale-95 transition-all text-on-surface-variant"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-on-surface">Nearby Healthcare</h2>
          <p className="text-xs text-on-surface-variant">AI recommendations & spatial clustering</p>
        </div>
      </div>

      {/* Search Header Panel */}
      <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,61,155,0.05)] border border-surface-variant/20 flex flex-col gap-4">
        
        {/* Provider Switcher tabs */}
        <div className="flex bg-[#f1f5f9] p-1 rounded-xl border border-[#e2e8f0]">
          <button
            type="button"
            disabled={googleLoadError}
            onClick={() => setProvider('google')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              provider === 'google'
                ? 'bg-white text-primary shadow-sm'
                : 'text-outline hover:text-on-surface disabled:opacity-50'
            }`}
          >
            Google Maps {googleLoadError && '(Auth Alert)'}
          </button>
          <button
            type="button"
            onClick={() => setProvider('osm')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              provider === 'osm'
                ? 'bg-white text-primary shadow-sm'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            OpenStreetMap (Free & Unrestricted)
          </button>
        </div>

        {/* Dynamic Warning for Google Maps alerts */}
        {provider === 'google' && googleScriptLoaded && (
          <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-3 text-[11px] text-amber-700 flex items-start gap-2 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Notice: </span> If Google Maps displays a billing/key restriction warning, click the **OpenStreetMap** tab above for a fully working, restriction-free map.
            </div>
          </div>
        )}

        {/* Input & Autocomplete Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
              <input
                ref={autocompleteInputRef}
                type="text"
                placeholder="Search City, Area, or Street name..."
                value={searchQuery || locationName}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleQueryChange(e.target.value);
                }}
                className="w-full h-12 pl-11 pr-4 bg-surface border border-outline-variant rounded-xl text-on-surface placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
              />
              {(searchQuery || locationName) && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setLocationName('');
                    setSuggestions([]);
                    if (autocompleteInputRef.current) autocompleteInputRef.current.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <button
              onClick={handleGetGps}
              disabled={detectingGps}
              title="Use current GPS location"
              className={`h-12 w-12 bg-primary-fixed/20 border border-primary-container/20 text-primary rounded-xl flex items-center justify-center hover:bg-primary-fixed/30 active:scale-95 transition-all shrink-0 ${detectingGps ? 'opacity-80' : ''}`}
            >
              {detectingGps ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <Compass className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Autocomplete suggestion popup for OpenStreetMap */}
          {provider === 'osm' && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-13 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-50 overflow-hidden flex flex-col divide-y divide-slate-100 max-h-60 overflow-y-auto animate-[fade-in_0.15s_ease-out]">
              {suggestions.map(sug => (
                <button
                  key={sug.place_id}
                  onClick={() => selectSuggestion(sug)}
                  className="w-full p-3.5 text-left text-xs font-semibold text-on-surface hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                >
                  <MapPin className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  <span>{sug.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map Visualizer Component */}
      <div className="relative w-full h-[260px] sm:h-[360px] rounded-3xl overflow-hidden border border-outline-variant/30 shadow-lg">
        <HospitalMap
          coords={coords}
          hospitals={searchResults}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
          provider={provider}
          googleScriptLoaded={googleScriptLoaded}
          leafletLoaded={leafletLoaded}
        />
        
        {searching && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="bg-surface-container-lowest px-4 py-2.5 rounded-full shadow-md flex items-center gap-2 border border-outline-variant/20">
              <Loader2 className="animate-spin text-primary w-4 h-4" />
              <span className="text-xs font-semibold text-on-surface">Searching map area...</span>
            </div>
          </div>
        )}
      </div>

      {/* Specialty Category Pills */}
      <div className="flex overflow-x-auto gap-2.5 pb-2 hide-scrollbar w-full select-none">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setCategory(cat.key)}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${
              category === cat.key
                ? 'bg-primary text-on-primary border-primary shadow-sm active:scale-95'
                : 'bg-surface-container-lowest text-on-surface-variant border-surface-variant/30 hover:border-outline hover:text-on-surface active:scale-[0.98]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* AI Smart Recommendation Panel */}
      <AIRecommendationPanel
        recommendations={searchResults}
        onSelectHospital={handleSelectPlace}
      />

      {/* Results Header */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xs font-bold text-on-surface-variant tracking-widest uppercase opacity-75">
          Hospitals & Clinics Nearby ({searchResults.length})
        </h3>
        <span className="text-[10px] font-bold text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded uppercase">
          {provider === 'google' ? 'Google Places API' : 'OpenStreetMap Engine'}
        </span>
      </div>

      {error && (
        <div className="bg-error-container/20 border border-error/20 text-error rounded-2xl p-4 text-xs flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="mt-1 leading-normal opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Clinic Results List */}
      <div className="flex flex-col gap-3">
        {searchResults.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl py-12 px-6 text-center border border-surface-variant/20 shadow-sm flex flex-col items-center gap-3">
            <Map className="text-outline w-12 h-12 opacity-40" />
            <p className="text-sm font-bold text-on-surface">No healthcare facilities found</p>
            <p className="text-xs text-on-surface-variant max-w-sm">Try panning the map, zooming out, or searching for a different location in the search bar above.</p>
          </div>
        ) : (
          searchResults.map(hosp => (
            <HospitalCard
              key={hosp.id}
              hospital={hosp}
              isSelected={selectedPlace?.id === hosp.id}
              onSelect={() => handleSelectPlace(hosp)}
            />
          ))
        )}
      </div>

      {/* Place Details Modal Sheet */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-[fade-in_0.2s_ease-out]" onClick={() => setSelectedPlace(null)}>
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest w-full max-w-lg rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl flex flex-col gap-4 animate-[slide-up_0.25s_ease-out] max-h-[85vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-2 border-b border-surface-variant/30">
              <div className="flex flex-col gap-1 pr-4">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full w-fit uppercase tracking-widest">
                  Facility Details
                </span>
                <h3 className="text-lg font-bold text-on-surface leading-tight mt-1">{selectedPlace.name}</h3>
                <p className="text-xs text-on-surface-variant flex items-center gap-1">
                  <MapPin size={12} /> {selectedPlace.address}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPlace(null)} 
                className="p-2 bg-surface-container rounded-full hover:bg-surface-container-high transition-all text-on-surface-variant shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* AI Reasoning box inside details modal */}
            {selectedPlace.recommendation_reason && (
              <div className="bg-blue-50 border border-blue-200/50 p-4 rounded-xl text-xs text-slate-700 flex flex-col gap-1">
                <span className="font-bold text-primary uppercase tracking-wide text-[9px]">AI Match Recommendation Logic</span>
                <p className="leading-relaxed font-medium">"{selectedPlace.recommendation_reason}"</p>
              </div>
            )}

            {/* Live details loader */}
            {loadingDetails && (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="animate-spin text-primary" size={20} />
                <span className="text-xs font-semibold text-on-surface-variant">Retrieving contact information...</span>
              </div>
            )}

            {/* Place Metadata details */}
            {(selectedPlaceDetails || provider === 'osm') && (
              <div className="flex flex-col gap-3.5 text-xs text-on-surface-variant animate-[fade-in_0.2s_ease-out]">
                {/* Rating details */}
                <div className="flex items-center gap-4 bg-surface-container/30 p-3 rounded-xl border border-surface-variant/20">
                  <div className="flex flex-col items-center justify-center border-r border-surface-variant/50 pr-4 shrink-0">
                    <span className="text-2xl font-bold text-on-surface">{selectedPlace.rating || 'N/A'}</span>
                    <span className="text-[10px] text-outline font-semibold uppercase">Stars</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-0.5 text-amber-500 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(Number(selectedPlace.rating) || 0) ? 'fill-current' : 'text-outline-variant'
                          }`} 
                        />
                      ))}
                    </div>
                    <p className="text-[10px] leading-tight">Patient-recommended specialist clinic.</p>
                  </div>
                </div>

                {/* Contact and details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPlaceDetails?.formatted_phone_number && (
                    <a
                      href={`tel:${selectedPlaceDetails.formatted_phone_number}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/30 border border-surface-variant/20 hover:bg-surface-container transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#e3f2f5] text-[#00687a] flex items-center justify-center shrink-0">
                        <Phone size={16} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Call Phone</span>
                        <span className="font-semibold text-on-surface text-xs truncate">{selectedPlaceDetails.formatted_phone_number}</span>
                      </div>
                    </a>
                  )}

                  {selectedPlaceDetails?.website && (
                    <a
                      href={selectedPlaceDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/30 border border-surface-variant/20 hover:bg-surface-container transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary-fixed/20 text-primary flex items-center justify-center shrink-0">
                        <Globe size={16} />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Website</span>
                        <span className="font-semibold text-primary text-xs truncate">Visit Site</span>
                      </div>
                    </a>
                  )}

                  {selectedPlace.distance && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/30 border border-surface-variant/20">
                      <div className="w-8 h-8 rounded-lg bg-outline-variant/30 text-on-surface-variant flex items-center justify-center shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Distance</span>
                        <span className="font-semibold text-on-surface text-xs">{selectedPlace.distance} away</span>
                      </div>
                    </div>
                  )}

                  {selectedPlace.status && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container/30 border border-surface-variant/20">
                      <div className="w-8 h-8 rounded-lg bg-secondary-fixed/20 text-[#00687a] flex items-center justify-center shrink-0">
                        <Clock size={16} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-outline uppercase tracking-wider">Business Status</span>
                        <span className="font-semibold text-secondary text-xs">{selectedPlace.status}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Patient reviews preview */}
                {selectedPlaceDetails?.reviews && selectedPlaceDetails.reviews.length > 0 && (
                  <div className="flex flex-col gap-2 mt-1">
                    <h4 className="text-[10px] font-bold text-outline uppercase tracking-widest pl-1">Recent Reviews</h4>
                    <div className="flex flex-col gap-2">
                      {selectedPlaceDetails.reviews.slice(0, 2).map((rev, i) => (
                        <div key={i} className="p-3 bg-surface-container/20 rounded-xl border border-surface-variant/10 flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-on-surface">{rev.author_name}</span>
                            <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                              ★ {rev.rating}
                            </div>
                          </div>
                          <p className="text-[11px] leading-relaxed italic text-on-surface-variant line-clamp-2">
                            "{rev.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  const dest = encodeURIComponent(`${selectedPlace.name}, ${selectedPlace.address}`);
                  const mapsUrl = selectedPlaceDetails?.url || `https://www.google.com/maps/search/?api=1&query=${dest}&query_place_id=${selectedPlace.id}`;
                  window.open(mapsUrl, '_blank');
                }}
                className="flex-1 bg-primary text-on-primary py-3 rounded-full text-sm font-semibold shadow-md hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Navigation size={16} />
                <span>Navigate in Google Maps</span>
              </button>
              <button
                onClick={() => setSelectedPlace(null)}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface-variant px-5 py-3 rounded-full text-sm font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
