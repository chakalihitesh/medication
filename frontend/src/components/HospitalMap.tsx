import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface HospitalMapProps {
  coords: { lat: number; lng: number };
  hospitals: any[];
  selectedPlace: any | null;
  onSelectPlace: (place: any) => void;
  provider: 'google' | 'osm';
  googleScriptLoaded: boolean;
  leafletLoaded: boolean;
}

const CLUSTER_COLORS = [
  '#ef4444', // Red (Cluster 0)
  '#3b82f6', // Blue (Cluster 1)
  '#10b981', // Green (Cluster 2)
  '#8b5cf6', // Purple (Cluster 3)
  '#f59e0b', // Amber (Cluster 4)
];

const CLUSTER_MARKER_ICONS = [
  'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/purple-dot.png',
  'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
];

export function HospitalMap({
  coords,
  hospitals,
  selectedPlace,
  onSelectPlace,
  provider,
  googleScriptLoaded,
  leafletLoaded,
}: HospitalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const googleMapInstanceRef = useRef<any>(null);
  const leafletMapInstanceRef = useRef<any>(null);
  
  const googleMarkersRef = useRef<any[]>([]);
  const leafletMarkersRef = useRef<any[]>([]);

  const destroyMaps = () => {
    // Clear Google Markers
    googleMarkersRef.current.forEach((m) => m.setMap(null));
    googleMarkersRef.current = [];
    googleMapInstanceRef.current = null;

    // Clear Leaflet Map
    if (leafletMapInstanceRef.current) {
      try {
        leafletMapInstanceRef.current.off();
        leafletMapInstanceRef.current.remove();
      } catch (e) {
        console.error('Error cleaning up Leaflet map:', e);
      }
      leafletMapInstanceRef.current = null;
    }
    leafletMarkersRef.current = [];
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    destroyMaps();

    if (provider === 'google' && googleScriptLoaded && window.google?.maps) {
      renderGoogleMap();
    } else if (provider === 'osm' && leafletLoaded && (window as any).L) {
      renderLeafletMap();
    }

    return () => destroyMaps();
  }, [provider, googleScriptLoaded, leafletLoaded, coords, hospitals]);

  // Handle zooming/panning to selected place
  useEffect(() => {
    if (!selectedPlace) return;
    const lat = selectedPlace.lat;
    const lng = selectedPlace.lng;
    if (!lat || !lng) return;

    if (provider === 'google' && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({ lat, lng });
      googleMapInstanceRef.current.setZoom(16);
    } else if (provider === 'osm' && leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.setView([lat, lng], 16);
    }
  }, [selectedPlace]);

  const renderGoogleMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) return;

    try {
      const map = new google.maps.Map(mapContainerRef.current, {
        center: coords,
        zoom: 13,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      googleMapInstanceRef.current = map;

      // User location marker
      const centerMarker = new google.maps.Marker({
        position: coords,
        map: map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: '#0052cc',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
      googleMarkersRef.current.push(centerMarker);

      // Add Hospital markers colored by cluster
      hospitals.forEach((hosp) => {
        if (!hosp.lat || !hosp.lng) return;

        const clusterId = hosp.cluster_id ?? 0;
        const iconUrl = CLUSTER_MARKER_ICONS[clusterId % CLUSTER_MARKER_ICONS.length];

        const marker = new google.maps.Marker({
          position: { lat: hosp.lat, lng: hosp.lng },
          map: map,
          title: hosp.name,
          icon: iconUrl,
          animation: google.maps.Animation.DROP,
        });

        marker.addListener('click', () => {
          onSelectPlace(hosp);
        });

        googleMarkersRef.current.push(marker);
      });
    } catch (e) {
      console.error('Failed to render Google Map:', e);
    }
  };

  const renderLeafletMap = () => {
    const L = (window as any).L;
    if (!mapContainerRef.current || !L) return;

    try {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([coords.lat, coords.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
      }).addTo(map);

      leafletMapInstanceRef.current = map;

      // Pulsing user marker
      const userIcon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full bg-[#0052cc] border-4 border-white shadow-md flex items-center justify-center animate-[pulse_2s_infinite]"><div class="w-2 h-2 rounded-full bg-white"></div></div>`,
        className: 'custom-user-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(map);

      // Hospital markers with color coded cluster tags
      hospitals.forEach((hosp) => {
        if (!hosp.lat || !hosp.lng) return;

        const clusterId = hosp.cluster_id ?? 0;
        const color = CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];

        const hospitalIcon = L.divIcon({
          html: `<div class="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-transform hover:scale-110" style="background-color: ${color}; color: #ffffff;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin">
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>`,
          className: 'custom-hosp-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const marker = L.marker([hosp.lat, hosp.lng], { icon: hospitalIcon }).addTo(map);
        marker.on('click', () => {
          onSelectPlace(hosp);
        });
        leafletMarkersRef.current.push(marker);
      });
    } catch (e) {
      console.error('Failed to render Leaflet Map:', e);
    }
  };

  return (
    <div className="relative w-full h-full bg-surface-container">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
