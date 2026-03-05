/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Clock, Wifi, Database, Cpu } from 'lucide-react';
import { NetworkNode } from '../types';

interface HeaderProps {
  nodes?: NetworkNode[];
}

export const Header: React.FC<HeaderProps> = ({ nodes = [] }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute live stats from node data
  const avgLatency = nodes.length
    ? Math.round(nodes.reduce((s, n) => s + n.telemetry.latency, 0) / nodes.length)
    : 42;
  const totalBandwidth = nodes.length
    ? (nodes.reduce((s, n) => s + n.telemetry.bandwidth, 0) / 1000).toFixed(1)
    : '14.2';
  const avgCpu = nodes.length
    ? Math.round(nodes.reduce((s, n) => s + n.telemetry.cpuLoad, 0) / nodes.length)
    : 28;

  const onlineCount = nodes.filter(n => n.status === 'ONLINE').length;
  const allOnline = nodes.length > 0 && onlineCount === nodes.length;
  const hasEmergency = nodes.some(n => n.status === 'OFFLINE');

  const stats = [
    { label: 'UPLINK LATENCY', value: `${avgLatency}ms`, icon: Wifi, color: 'text-emerald-400' },
    { label: 'GLOBAL BANDWIDTH', value: `${totalBandwidth} Tbps`, icon: Database, color: 'text-blue-400' },
    { label: 'ORCHESTRATOR LOAD', value: `${avgCpu}%`, icon: Cpu, color: 'text-amber-400' },
  ];

  return (
    <header className="h-16 bg-[#0a0a0c] border-b border-[#1e1e24] flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 text-zinc-400">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-mono tracking-widest uppercase">
            {time.toLocaleTimeString('en-GB', { hour12: false })} UTC
          </span>
        </div>

        <div className="h-4 w-px bg-[#1e1e24]" />

        <div className="flex items-center gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color} opacity-70`} />
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-500 font-mono tracking-tighter leading-none mb-0.5">
                  {stat.label}
                </span>
                <span className="text-[11px] text-zinc-200 font-mono leading-none">
                  {stat.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 px-3 py-1 rounded ${
          hasEmergency
            ? 'bg-red-500/10 border border-red-500/20'
            : 'bg-emerald-500/10 border border-emerald-500/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            hasEmergency ? 'bg-red-500' : 'bg-emerald-500'
          }`} />
          <span className={`text-[10px] font-bold tracking-widest uppercase ${
            hasEmergency ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {hasEmergency ? 'Alert Active' : allOnline ? 'All Systems Nominal' : 'System Nominal'}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
          <span className="text-[10px] font-bold text-zinc-400">JR</span>
        </div>
      </div>
    </header>
  );
};
