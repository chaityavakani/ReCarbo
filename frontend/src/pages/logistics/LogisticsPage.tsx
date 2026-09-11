import React, { useEffect, useRef } from 'react';
import { Truck, MapPin, Navigation, ShieldCheck, Compass, Route } from 'lucide-react';

export const LogisticsPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Dynamic Leaflet instantiation with OpenStreetMap & fallback
    if (typeof window !== 'undefined' && mapContainerRef.current && !mapInstanceRef.current) {
      import('leaflet').then((L) => {
        if (!mapContainerRef.current) return;

        // Clean any leftover leaflet state
        const map = L.map(mapContainerRef.current).setView([22.2587, 72.8], 8);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        // Gujarat Industrial Hub Points
        const hubs = [
          { name: 'Dahej / Bharuch (Capture Hub)', lat: 21.7051, lng: 72.9959, type: 'SUPPLIER' },
          { name: 'Hazira / Surat (Chemical Hub)', lat: 21.1702, lng: 72.8311, type: 'SUPPLIER' },
          { name: 'Sanand / Ahmedabad (Polymer Plant)', lat: 23.0225, lng: 72.5714, type: 'BUYER' },
          { name: 'Nandesari / Vadodara (Concrete Curing)', lat: 22.3072, lng: 73.1812, type: 'BUYER' },
        ];

        hubs.forEach((hub) => {
          const markerColor = hub.type === 'SUPPLIER' ? '#10b981' : '#06b6d4';
          const customCircle = L.circleMarker([hub.lat, hub.lng], {
            radius: 8,
            fillColor: markerColor,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          }).addTo(map);

          customCircle.bindPopup(
            `<strong>${hub.name}</strong><br/>Role: ${hub.type}<br/>Status: Active Node`
          );
        });

        // Draw transit route Dahej -> Sanand
        const routeCoords: [number, number][] = [
          [21.7051, 72.9959],
          [22.3072, 73.1812],
          [23.0225, 72.5714],
        ];

        L.polyline(routeCoords, {
          color: '#10b981',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.8,
        }).addTo(map);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <Truck className="w-7 h-7 text-brand-400" />
          <span>Carbon Logistics & Corridor Network</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time GIS routing for cryogenic liquid tankers and pressurized tube trailers in Gujarat
        </p>
      </div>

      {/* Map Container */}
      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-4 shadow-2xl space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Route className="w-4 h-4 text-emerald-400" />
            <span>Active Gujarat Transit Corridor (Dahej ↔ Vadodara ↔ Sanand)</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Supplier Hub</span>
            </span>
            <span className="flex items-center space-x-1 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" />
              <span>Buyer Facility</span>
            </span>
          </div>
        </div>

        <div
          ref={mapContainerRef}
          className="w-full h-[450px] rounded-2xl overflow-hidden border border-emerald-950"
        />
      </div>
    </div>
  );
};
