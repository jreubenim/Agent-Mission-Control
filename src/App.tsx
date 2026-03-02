/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TelemetryGrid } from './components/TelemetryGrid';
import { AgentOrchestrator } from './components/AgentOrchestrator';
import { NetworkMap } from './components/NetworkMap';
import { SigintPanel } from './components/SigintPanel';
import { GeographicCoverageMap } from './components/GeographicCoverageMap';
import { INITIAL_NODES, INITIAL_AGENTS } from './constants';
import { SegmentType } from './types';

export default function App() {
  const [activeSegment, setActiveSegment] = useState<SegmentType | 'AGENTS' | 'SIGINT' | 'GEOGRAPHIC'>('DOMESTIC');
  const [geoFilter, setGeoFilter] = useState<SegmentType | 'ALL'>('ALL');
  
  const filteredNodes = typeof activeSegment === 'string' && ['DOMESTIC', 'OVERSEAS', 'MARITIME', 'SPACE'].includes(activeSegment)
    ? INITIAL_NODES.filter(node => node.type === activeSegment)
    : INITIAL_NODES;

  return (
    <div className="flex h-screen bg-[#050507] text-zinc-200 overflow-hidden font-sans">
      <Sidebar activeSegment={activeSegment} onSegmentChange={setActiveSegment} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto bg-[#050507] relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1e24_1px,transparent_1px),linear-gradient(to_bottom,#1e1e24_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] pointer-events-none" />

          <div className="relative z-10 h-full">
            {activeSegment === 'AGENTS' ? (
              <AgentOrchestrator agents={INITIAL_AGENTS} />
            ) : activeSegment === 'SIGINT' ? (
              <SigintPanel />
            ) : activeSegment === 'GEOGRAPHIC' ? (
              <div className="p-8 h-full flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight uppercase">Global Geographic Coverage</h2>
                    <p className="text-xs text-zinc-500 font-mono mt-1">Line-of-Sight analysis and blind spot detection</p>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0d0d12] border border-[#1e1e24] p-1 rounded">
                    {['ALL', 'DOMESTIC', 'OVERSEAS', 'MARITIME', 'SPACE'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setGeoFilter(f as any)}
                        className={`px-3 py-1 text-[10px] font-mono rounded transition-colors
                          ${geoFilter === f ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-h-[500px]">
                  <GeographicCoverageMap nodes={INITIAL_NODES} activeSegment={geoFilter} />
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="h-[400px] border-b border-[#1e1e24]">
                  <NetworkMap nodes={INITIAL_NODES} activeSegment={activeSegment} />
                </div>
                <div className="flex-1">
                  <div className="px-8 pt-8 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight uppercase">
                        {activeSegment} Segment Telemetry
                      </h2>
                      <p className="text-xs text-zinc-500 font-mono mt-1">
                        Real-time monitoring of {filteredNodes.length} active nodes
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-mono text-zinc-400 uppercase">Surge Capacity: Nominal</span>
                      </div>
                      <button className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors uppercase tracking-widest">
                        Initiate Surge
                      </button>
                    </div>
                  </div>
                  <TelemetryGrid nodes={filteredNodes} />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
