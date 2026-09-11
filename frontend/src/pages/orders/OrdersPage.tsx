import React from 'react';
import { FileSpreadsheet, Truck, CheckCircle2, Clock, MapPin, Eye } from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const demoOrders = [
    {
      id: 'ord-1',
      orderNumber: 'RC-2025-00124',
      supplier: 'Gujarat Carbon Capture Ltd (Dahej)',
      buyer: 'Aura Polymer Materials (Ahmedabad)',
      quantityTonnes: 30,
      totalAmount: 168750,
      status: 'CONFIRMED',
      paymentStatus: 'ESCROW_HELD',
      date: '2025-02-14',
      route: 'Dahej → Sanand (190 km)',
    },
    {
      id: 'ord-2',
      orderNumber: 'RC-2025-00098',
      supplier: 'Hazira Green Synthesis (Surat)',
      buyer: 'Vadodara Eco-Concrete Works',
      quantityTonnes: 50,
      totalAmount: 215000,
      status: 'DELIVERED',
      paymentStatus: 'RELEASED',
      date: '2025-01-28',
      route: 'Hazira → Nandesari (155 km)',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center space-x-3">
          <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
          <span>Orders & Delivery Ledger</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Track binding CO2 procurement orders, escrow status, and cryogenic dispatch schedules
        </p>
      </div>

      <div className="rounded-3xl bg-charcoal-900 border border-emerald-950/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-charcoal-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-emerald-950/60">
              <tr>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Supplier & Buyer</th>
                <th className="p-4">Volume</th>
                <th className="p-4">Total Value</th>
                <th className="p-4">Route & Transit</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/40">
              {demoOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-charcoal-800/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-cyan-400">{ord.orderNumber}</td>
                  <td className="p-4">
                    <div className="font-semibold text-white">{ord.buyer}</div>
                    <div className="text-[11px] text-slate-400">from {ord.supplier}</div>
                  </td>
                  <td className="p-4 font-mono font-bold text-white">{ord.quantityTonnes} Tonnes</td>
                  <td className="p-4 font-mono font-bold text-brand-400">
                    ₹{ord.totalAmount.toLocaleString()}
                  </td>
                  <td className="p-4 text-slate-300 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{ord.route}</span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.status === 'DELIVERED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
