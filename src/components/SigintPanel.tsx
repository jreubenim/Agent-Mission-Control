/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SigintEvent } from '../types';
import { Radio, Target, Crosshair, ShieldAlert, MapPin } from 'lucide-react';

export const SigintPanel: React.FC = () => {
  const events: SigintEvent[] = [
    { id: 'SIG-001', timestamp: '14:22:05', frequency: '2.45 GHz', location: { lat: 35.2, lng: 128.4 }, confidence: 0.98, type: 'EMISSION' },
    { id: 'SIG-002', timestamp: '14:25:12', frequency: '12.1 GHz', location: { lat: -12.5, lng: 110.2 }, confidence: 0.85, type: 'GEOLOCATION' },
    { id: 'SIG-003', timestamp: '14:28:44', frequency: '435 MHz', location: { lat: 45.8, lng: -75.2 }, confidence: 0.92, type: 'INTERCEPT' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#0d0d12] border border-[#1e1e24] rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Radio className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Intercepts</h3>
          </div>
          <div className="text-3xl font-mono text-white">14</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">Across 4 Baselines</div>
        </div>
        <div className="p-6 bg-[#0d0d12] border border-[#1e1e24] rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Geolocation Accuracy</h3>
          </div>
          <div className="text-3xl font-mono text-white">±1.2m</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">Optimized Geometry</div>
        </div>
        <div className="p-6 bg-[#0d0d12] border border-[#1e1e24] rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Unidentified Emissions</h3>
          </div>
          <div className="text-3xl font-mono text-white">03</div>
          <div className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">Pending Characterization</div>
        </div>
      </div>

      <div className="bg-[#0d0d12] border border-[#1e1e24] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#1e1e24] bg-white/[0.02] flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Recent SIGINT Events</h3>
          <button className="text-[10px] font-mono text-emerald-500 hover:text-emerald-400 uppercase tracking-tighter">Export Data</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e1e24] text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4 font-medium">ID</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Frequency</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Confidence</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-mono text-zinc-300">
              {events.map((event) => (
                <tr key={event.id} className="border-b border-[#1e1e24] hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 text-emerald-500 font-bold">{event.id}</td>
                  <td className="px-6 py-4">{event.timestamp}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {event.type === 'EMISSION' ? <Radio className="w-3 h-3 text-blue-400" /> :
                       event.type === 'INTERCEPT' ? <Crosshair className="w-3 h-3 text-amber-400" /> :
                       <MapPin className="w-3 h-3 text-emerald-400" />}
                      {event.type}
                    </div>
                  </td>
                  <td className="px-6 py-4">{event.frequency}</td>
                  <td className="px-6 py-4">{event.location.lat}, {event.location.lng}</td>
                  <td className="px-6 py-4">
                    <div className="w-24 bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${event.confidence * 100}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors">ANALYZE</button>
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
