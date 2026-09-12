import React, { useEffect, useRef, useState } from 'react';
import {
  Truck,
  MapPin,
  Navigation,
  ShieldCheck,
  Compass,
  Route,
  ArrowRight,
  Clock,
  DollarSign,
  Layers,
  Scale,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HubNode {
  id: string;
  name: string;
  city: string;
  type: 'SUPPLIER' | 'BUYER';
  role: string;
  lat: number;
  lng: number;
}

const GUJARAT_HUBS: HubNode[] = [
  {
    id: 'dahej',
    name: 'Dahej Chemical Corridor (Gujarat Carbon)',
    city: 'Bharuch',
    type: 'SUPPLIER',
    role: 'Amine Absorption Capture Hub (50T/day)',
    lat: 21.7051,
    lng: 72.9959,
  },
  {
    id: 'hazira',
    name: 'Hazira Industrial Synthesis (Hazira Green)',
    city: 'Surat',
    type: 'SUPPLIER',
    role: 'High-Purity Byproduct Stream (120T/day)',
    lat: 21.1702,
    lng: 72.8311,
  },
  {
    id: 'sanand',
    name: 'Sanand Industrial Cluster (Aura Polymer)',
    city: 'Ahmedabad',
    type: 'BUYER',
    role: 'Polycarbonate Polymer Offtaker (30T/month)',
    lat: 23.0225,
    lng: 72.5714,
  },
  {
    id: 'vadodara',
    name: 'Nandesari Eco-Concrete Facility',
    city: 'Vadodara',
    type: 'BUYER',
    role: 'Mineral Concrete Curing Yard (45T/month)',
    lat: 22.3072,
    lng: 73.1812,
  },
  {
    id: 'jamnagar',
    name: 'Jamnagar Energy & Petrochemicals Hub',
    city: 'Jamnagar',
    type: 'SUPPLIER',
    role: 'Industrial Capture & Refining (200T/day)',
    lat: 22.4707,
    lng: 70.0577,
  },
  {
    id: 'ankleshwar',
    name: 'Ankleshwar Specialty Chemicals Area',
    city: 'Ankleshwar',
    type: 'BUYER',
    role: 'Fine Chemical Carbonation Feedstock',
    lat: 21.6264,
    lng: 73.0035,
  },
];

interface RouteCorridor {
  id: string;
  title: string;
  originHub: string;
  destHub: string;
  distanceKm: number;
  hours: number;
  waypoints: [number, number][];
}

const CORRIDORS: RouteCorridor[] = [
  {
    id: 'dahej-sanand',
    title: 'Dahej Capture Hub ➔ Sanand Polymer Facility',
    originHub: 'dahej',
    destHub: 'sanand',
    distanceKm: 190,
    hours: 4.2,
    waypoints: [
      [21.7051, 72.9959], // Dahej
      [22.3072, 73.1812], // Vadodara junction
      [23.0225, 72.5714], // Sanand
    ],
  },
  {
    id: 'hazira-vadodara',
    title: 'Hazira Synthesis Hub ➔ Vadodara Concrete Works',
    originHub: 'hazira',
    destHub: 'vadodara',
    distanceKm: 145,
    hours: 3.1,
    waypoints: [
      [21.1702, 72.8311], // Hazira
      [21.6264, 73.0035], // Ankleshwar
      [22.3072, 73.1812], // Vadodara
    ],
  },
  {
    id: 'dahej-jamnagar',
    title: 'Dahej Capture ➔ Jamnagar Refining Corridor',
    originHub: 'dahej',
    destHub: 'jamnagar',
    distanceKm: 360,
    hours: 7.5,
    waypoints: [
      [21.7051, 72.9959], // Dahej
      [22.3072, 73.1812], // Vadodara
      [22.3039, 70.8022], // Rajkot
      [22.4707, 70.0577], // Jamnagar
    ],
  },
];

export const LogisticsPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);

  const [selectedCorridor, setSelectedCorridor] = useState<RouteCorridor>(CORRIDORS[0]);
  const [cargoTonnes, setCargoTonnes] = useState<number>(25);

  // Freight rate from platform defaults (₹0.015/km/kg)
  const transportRatePerKmKg = 0.015;
  const cargoKg = cargoTonnes * 1000;
  const estimatedFreightCost = Math.round(cargoKg * selectedCorridor.distanceKm * transportRatePerKmKg);

  useEffect(() => {
    if (typeof window !== 'undefined' && mapContainerRef.current && !mapInstanceRef.current) {
      import('leaflet').then((L) => {
        if (!mapContainerRef.current) return;

        // Custom Leaflet map with dark style / OpenStreetMap
        const map = L.map(mapContainerRef.current, {
          center: [22.2587, 72.4],
          zoom: 7,
          scrollWheelZoom: true,
        });
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors | ReCarbo GIS',
          maxZoom: 18,
        }).addTo(map);

        // Add Hub Markers
        GUJARAT_HUBS.forEach((hub) => {
          const isSupplier = hub.type === 'SUPPLIER';
          const markerColor = isSupplier ? '#10b981' : '#06b6d4';

          const marker = L.circleMarker([hub.lat, hub.lng], {
            radius: 9,
            fillColor: markerColor,
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.9,
          }).addTo(map);

          marker.bindPopup(`
            <div style="font-family: sans-serif; font-size: 12px; color: #000;">
              <strong>${hub.name}</strong><br/>
              <span style="color: ${isSupplier ? '#059669' : '#0284c7'}; font-weight: bold;">
                ${isSupplier ? '🏭 CO2 Capture Stream Supplier' : '🏗️ Industrial Offtake Facility'}
              </span><br/>
              <span style="font-size: 11px; color: #475569;">${hub.role}</span>
            </div>
          `);
        });

        // Draw initial corridor route
        const polyline = L.polyline(CORRIDORS[0].waypoints, {
          color: '#10b981',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.85,
        }).addTo(map);

        polylineRef.current = polyline;
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Route Polyline when corridor changes
  useEffect(() => {
    if (polylineRef.current && mapInstanceRef.current) {
      import('leaflet').then((L) => {
        polylineRef.current.setLatLngs(selectedCorridor.waypoints);
        mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
      });
    }
  }, [selectedCorridor]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-500/10 text-brand-400 border border-brand-500/30">
              Corridor GIS Routing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3 mt-1">
            <Truck className="w-7 h-7 text-brand-400" />
            <span>Carbon Logistics & Corridor Network</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time GIS routing for cryogenic liquid tankers and tube trailers across Gujarat industrial hubs
          </p>
        </div>

        <Link
          to={`/calculator?distance=${selectedCorridor.distanceKm}&quantity=${cargoTonnes}`}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 text-charcoal-950 font-bold text-xs shadow-md shadow-brand-500/20 transition-all flex items-center space-x-2 self-start sm:self-center"
        >
          <span>Calculate Landed Cost</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Container: Interactive Map + Active Corridor Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map (2 Columns) */}
        <div className="lg:col-span-2 rounded-3xl bg-charcoal-900 border border-emerald-950/80 p-4 shadow-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 gap-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <Route className="w-4 h-4 text-emerald-400" />
              <span>{selectedCorridor.title}</span>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50" />
                <span>Supplier Capture Node</span>
              </span>
              <span className="flex items-center space-x-1 text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block shadow-sm shadow-cyan-500/50" />
                <span>Buyer Offtaker Facility</span>
              </span>
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[480px] rounded-2xl overflow-hidden border border-emerald-950 z-0"
          />
        </div>

        {/* Corridor Selector & Cost Breakdown (1 Column) */}
        <div className="space-y-5">
          {/* Corridor Selection List */}
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-950 p-5 space-y-3 shadow-xl">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Industrial Transit Corridor
            </h3>

            <div className="space-y-2">
              {CORRIDORS.map((corridor) => (
                <button
                  key={corridor.id}
                  onClick={() => setSelectedCorridor(corridor)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all ${
                    selectedCorridor.id === corridor.id
                      ? 'bg-emerald-950/80 border-emerald-500 text-brand-300 shadow-md shadow-brand-500/10'
                      : 'bg-charcoal-950 border-emerald-950 text-slate-400 hover:border-emerald-800'
                  }`}
                >
                  <div className="text-xs font-bold text-white leading-tight">{corridor.title}</div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-2">
                    <span className="text-emerald-400 font-bold">{corridor.distanceKm} km</span>
                    <span>~{corridor.hours} hrs transit</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Freight Calculation Card */}
          <div className="rounded-3xl bg-charcoal-900 border border-emerald-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Corridor Freight Estimate
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                ₹0.015 / km / kg
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Shipment Payload:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {cargoTonnes} Tonnes ({cargoKg.toLocaleString()} kg)
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={cargoTonnes}
                  onChange={(e) => setCargoTonnes(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-charcoal-950 h-2 rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-2 pt-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Transit Distance:</span>
                  <strong className="text-white font-mono">{selectedCorridor.distanceKm} km</strong>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Road Transit Time:</span>
                  <strong className="text-cyan-400 font-mono">~{selectedCorridor.hours} Hours</strong>
                </div>
                <div className="flex justify-between">
                  <span>Fleet Equipment:</span>
                  <strong className="text-white">Cryogenic Road Tanker</strong>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-950 flex justify-between items-baseline">
                <span className="text-xs font-bold text-white">Estimated Freight Cost:</span>
                <div className="text-xl font-bold text-brand-400 font-mono">
                  ₹{estimatedFreightCost.toLocaleString()}
                </div>
              </div>
            </div>

            <Link
              to={`/calculator?distance=${selectedCorridor.distanceKm}&quantity=${cargoTonnes}`}
              className="block w-full py-2.5 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 text-emerald-300 border border-emerald-500/30 text-xs font-bold text-center transition-colors"
            >
              Open in Full Cost Estimator →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
