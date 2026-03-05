/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { TelemetryGrid } from './components/TelemetryGrid';
import { AgentOrchestrator } from './components/AgentOrchestrator';
import { NetworkMap } from './components/NetworkMap';
import { SigintPanel } from './components/SigintPanel';
import { GeographicCoverageMap } from './components/GeographicCoverageMap';
import { ChatPanel } from './components/ChatPanel';
import { AlertsPanel } from './components/AlertsPanel';
import { MissionCommandCenter } from './components/MissionCommandCenter';
import { SensorPanel } from './components/SensorPanel';
import { AgentIPCLog } from './components/AgentIPCLog';
import { INITIAL_NODES, INITIAL_AGENTS } from './constants';
import { SegmentType, NetworkNode } from './types';

type ViewType = SegmentType | 'AGENTS' | 'SIGINT' | 'GEOGRAPHIC' | 'ALERTS' | 'MISSIONS' | 'SENSORS' | 'IPC_LOG';

// Map Convex node docs to the frontend NetworkNode type
function mapConvexNodes(docs: any[] | undefined): NetworkNode[] {
  if (!docs) return INITIAL_NODES;
  return docs.map((d) => ({
    id: d.nodeId,
    name: d.name,
    type: d.type as SegmentType,
    status: d.status,
    location: d.location,
    telemetry: d.telemetry,
    alarmActive: d.alarmActive,
    powerRouting: d.powerRouting,
  }));
}

export default function App() {
  const [activeSegment, setActiveSegment] = useState<ViewType>('DOMESTIC');
  const [geoFilter, setGeoFilter] = useState<SegmentType | 'ALL'>('ALL');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Convex queries with graceful fallback
  const convexNodes = useQuery(api.queries.nodes.getAll);
  const convexAgents = useQuery(api.queries.agents.getAll);

  const nodes = mapConvexNodes(convexNodes);
  const agents = convexAgents ?? INITIAL_AGENTS;

  const filteredNodes = typeof activeSegment === 'string' && ['DOMESTIC', 'OVERSEAS', 'MARITIME', 'SPACE'].includes(activeSegment)
    ? nodes.filter(node => node.type === activeSegment)
    : nodes;

  const renderMainContent = () => {
    switch (activeSegment) {
      case 'AGENTS':
        return <AgentOrchestrator agents={agents as any} />;
      case 'SIGINT':
        return <SigintPanel />;
      case 'ALERTS':
        return <AlertsPanel />;
      case 'MISSIONS':
        return <MissionCommandCenter nodes={nodes} />;
      case 'SENSORS':
        return <SensorPanel />;
      case 'IPC_LOG':
        return <AgentIPCLog />;
      case 'GEOGRAPHIC':
        return (
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
              <GeographicCoverageMap nodes={nodes} activeSegment={geoFilter} />
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col h-full">
            <div className="h-[400px] border-b border-[#1e1e24]">
              <NetworkMap nodes={nodes} activeSegment={activeSegment as SegmentType} />
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
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#050507] text-zinc-200 overflow-hidden font-sans">
      <Sidebar activeSegment={activeSegment} onSegmentChange={setActiveSegment} onToggleChat={() => setIsChatOpen(prev => !prev)} isChatOpen={isChatOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header nodes={nodes} />

        <main className="flex-1 overflow-y-auto bg-[#050507] relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1e24_1px,transparent_1px),linear-gradient(to_bottom,#1e1e24_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] pointer-events-none" />
          <div className="relative z-10 h-full">
            {renderMainContent()}
          </div>
        </main>
      </div>

      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
