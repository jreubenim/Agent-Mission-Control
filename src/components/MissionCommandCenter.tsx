import React, { useRef, useEffect, useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Rocket, Wifi, WifiOff, Battery, StopCircle, Play } from 'lucide-react';
import { NetworkNode } from '../types';

interface Props { nodes: NetworkNode[] }

const STATUS_COLOR: Record<string, string> = {
  PLANNING:   '#71717a',
  DEPLOYING:  '#facc15',
  ACTIVE:     '#34d399',
  SCANNING:   '#60a5fa',
  RETURNING:  '#fb923c',
  COMPLETE:   '#3f3f46',
};

const ASSET_ICON: Record<string, string> = { drone: '✈', robot: '🤖', swarm: '⬡' };

// ── Helpers ───────────────────────────────────────────────────────────────────
const lerp2 = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, Math.max(0, t));

// ── D3 Drone Map ──────────────────────────────────────────────────────────────
const DroneMap: React.FC<{ nodes: NetworkNode[]; missions: any[] }> = ({ nodes, missions }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll('*').remove();
    const { width, height } = svgRef.current!.getBoundingClientRect();
    if (!width) return;

    const proj = d3.geoMercator().center([10, 50]).scale(width * 0.8).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(proj);

    // World borders
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then((world: any) => {
        const g = svg.append('g');

        g.append('g')
          .selectAll('path')
          .data((topojson.feature(world, world.objects.countries) as any).features)
          .join('path')
          .attr('d', path as any)
          .attr('fill', '#0d0d12')
          .attr('stroke', '#1e1e24')
          .attr('stroke-width', 0.5);

        // Node dots
        nodes.forEach(node => {
          const [x, y] = proj([node.location.lng, node.location.lat]) ?? [0, 0];
          const col = node.status === 'ONLINE' ? '#34d399'
            : node.status === 'DEGRADED' ? '#fb923c'
            : node.status === 'OFFLINE' ? '#ef4444'
            : '#facc15';

          g.append('circle').attr('cx', x).attr('cy', y).attr('r', 4)
            .attr('fill', col).attr('fill-opacity', 0.8)
            .attr('stroke', col).attr('stroke-width', 1);
        });

        // Missions: threat zones, flight paths, animated asset icons
        missions.filter(m => m.status !== 'COMPLETE').forEach(mission => {
          if (!mission.targetLocation) return;
          const [tx, ty] = proj([mission.targetLocation.lng, mission.targetLocation.lat]) ?? [0, 0];
          const [bx, by] = proj([mission.baseLocation.lng, mission.baseLocation.lat]) ?? [0, 0];

          // Full flight path (faint)
          g.append('line')
            .attr('x1', bx).attr('y1', by).attr('x2', tx).attr('y2', ty)
            .attr('stroke', '#334155').attr('stroke-width', 1).attr('stroke-dasharray', '4,4')
            .attr('opacity', 0.4);

          // Progress line (bright) — shows how far drones have flown
          const progress = (mission.progress ?? 0) / 100;
          const px = lerp2(bx, tx, progress), py = lerp2(by, ty, progress);
          g.append('line')
            .attr('x1', bx).attr('y1', by).attr('x2', px).attr('y2', py)
            .attr('stroke', STATUS_COLOR[mission.status] ?? '#60a5fa')
            .attr('stroke-width', 2).attr('stroke-dasharray', '5,3').attr('opacity', 0.8);

          // Base marker (diamond)
          g.append('path')
            .attr('d', `M${bx},${by - 5} L${bx + 4},${by} L${bx},${by + 5} L${bx - 4},${by} Z`)
            .attr('fill', '#475569').attr('stroke', '#94a3b8').attr('stroke-width', 0.5);

          // Threat zone pulsing ring at target
          const ring = g.append('circle').attr('cx', tx).attr('cy', ty)
            .attr('r', 16).attr('fill', 'none').attr('stroke', '#ef4444')
            .attr('stroke-width', 1.5).attr('opacity', 0.7);
          function pulseRing() {
            ring.transition().duration(1000).attr('r', 26).attr('opacity', 0.2)
              .transition().duration(1000).attr('r', 16).attr('opacity', 0.7)
              .on('end', pulseRing);
          }
          pulseRing();

          // Asset dots at their interpolated positions
          mission.assets.filter((a: any) => a.status !== 'OFFLINE').forEach((asset: any) => {
            const [ax, ay] = proj([asset.currentPosition.lng, asset.currentPosition.lat]) ?? [0, 0];
            const col = asset.type === 'drone' ? '#60a5fa' : asset.type === 'swarm' ? '#a78bfa' : '#34d399';

            // Outer pulse for active assets
            if (asset.status === 'ACTIVE') {
              const pulse = g.append('circle').attr('cx', ax).attr('cy', ay)
                .attr('r', 5).attr('fill', 'none').attr('stroke', col).attr('opacity', 0.5);
              function pulseDot() {
                pulse.transition().duration(900).attr('r', 11).attr('opacity', 0)
                  .transition().duration(0).attr('r', 5).attr('opacity', 0.5)
                  .on('end', pulseDot);
              }
              pulseDot();
            }

            g.append('circle').attr('cx', ax).attr('cy', ay).attr('r', 4)
              .attr('fill', col).attr('stroke', '#fff').attr('stroke-width', 0.5)
              .append('title').text(`${asset.name} · ${asset.status} · 🔋${asset.batteryPercent}%`);
          });
        });
      })
      .catch(() => {/* silently skip if offline */});
  }, [nodes, missions]);

  return <svg ref={svgRef} className="w-full h-full" />;
};

// ── Robot Feed ────────────────────────────────────────────────────────────────
const RobotFeed: React.FC = () => {
  const hwSession = useQuery(api.queries.hardwareSessions.getActive);
  const haltRobot = useAction(api.actions.jetsonBridge.haltRobot);
  const registerSession = useAction(api.actions.jetsonBridge.registerSession);
  const [halting, setHalting] = useState(false);
  const [ip, setIp] = useState('');
  const [sshUser, setSshUser] = useState('jetson');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState('');

  const handleConnect = async () => {
    if (!ip.trim()) return;
    setConnecting(true);
    setConnectError('');
    try {
      const result = await registerSession({ jetsonTailscaleIp: ip.trim(), sshUser: sshUser.trim() });
      if (!result.reachable) setConnectError(`Registered but SSH unreachable — check Tailscale & SSH key. (${result.output.slice(0, 80)})`);
    } catch (e: any) {
      setConnectError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  if (!hwSession) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono">
          <WifiOff className="w-3.5 h-3.5" />
          <span>No Jetson connected</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={ip}
            onChange={e => setIp(e.target.value)}
            placeholder="Tailscale IP (100.x.x.x)"
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono rounded px-3 py-1.5 w-44 outline-none focus:border-emerald-500/50"
          />
          <input
            value={sshUser}
            onChange={e => setSshUser(e.target.value)}
            placeholder="SSH user"
            className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs font-mono rounded px-3 py-1.5 w-24 outline-none focus:border-emerald-500/50"
          />
          <button
            onClick={handleConnect}
            disabled={connecting || !ip.trim()}
            className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-xs font-bold text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 uppercase tracking-wider"
          >
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        </div>
        {connectError && <p className="text-red-400 text-[10px] font-mono">{connectError}</p>}
        <p className="text-[9px] font-mono text-zinc-700">
          Requires JETSON_SSH_KEY env var set in Convex dashboard (base64-encoded PEM).
          Set via: <span className="text-zinc-500">npx convex env set JETSON_SSH_KEY "$(base64 ~/.ssh/id_rsa)"</span>
        </p>
      </div>
    );
  }

  const { robotStatus } = hwSession;
  const foxgloveUrl = `http://${hwSession.jetsonTailscaleIp}:8765`;

  const handleHalt = async () => {
    setHalting(true);
    try { await haltRobot({ sessionId: hwSession.sessionId }); }
    finally { setHalting(false); }
  };

  return (
    <div className="flex gap-4 items-start">
      {/* Foxglove embed */}
      <div className="flex-1 min-w-0 h-40 bg-black rounded overflow-hidden border border-zinc-800 relative">
        <iframe
          src={foxgloveUrl}
          className="w-full h-full"
          title="Foxglove Studio"
          onError={() => {}}
        />
        <div className="absolute top-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-400">
          FOXGLOVE LIVE
        </div>
      </div>

      {/* Status + controls */}
      <div className="flex flex-col gap-2 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <Wifi className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-mono text-emerald-400">CONNECTED</span>
        </div>
        <div className="text-[10px] font-mono text-zinc-500">{hwSession.jetsonTailscaleIp}</div>

        <div className="space-y-1 text-[10px] font-mono">
          <div className="flex justify-between">
            <span className="text-zinc-500">Motor L</span>
            <span className={robotStatus.motorLeft === 'on' ? 'text-emerald-400' : robotStatus.motorLeft === 'error' ? 'text-red-400' : 'text-zinc-600'}>
              {robotStatus.motorLeft.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Motor R</span>
            <span className={robotStatus.motorRight === 'on' ? 'text-emerald-400' : robotStatus.motorRight === 'error' ? 'text-red-400' : 'text-zinc-600'}>
              {robotStatus.motorRight.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">LiDAR</span>
            <span className={robotStatus.lidarActive ? 'text-blue-400' : 'text-zinc-600'}>
              {robotStatus.lidarActive ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          {robotStatus.batteryPercent != null && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Battery</span>
              <span className="text-zinc-300">{robotStatus.batteryPercent}%</span>
            </div>
          )}
        </div>

        <button
          onClick={handleHalt}
          disabled={halting}
          className="flex items-center gap-1.5 px-2 py-1.5 bg-red-500/20 border border-red-500/40 rounded text-[10px] font-bold text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 uppercase"
        >
          <StopCircle className="w-3 h-3" />
          {halting ? 'HALTING…' : 'HALT ROBOT'}
        </button>
      </div>
    </div>
  );
};

// ── Mission Timeline ──────────────────────────────────────────────────────────
const STAGES = ['PLANNING', 'DEPLOYING', 'ACTIVE', 'SCANNING', 'RETURNING', 'COMPLETE'];

const MissionTimeline: React.FC<{ status: string }> = ({ status }) => {
  const idx = STAGES.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {STAGES.map((stage, i) => (
        <React.Fragment key={stage}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-2.5 h-2.5 rounded-full border ${
              i < idx ? 'bg-emerald-500 border-emerald-500'
              : i === idx ? 'bg-blue-400 border-blue-400 animate-pulse'
              : 'bg-transparent border-zinc-700'
            }`} />
            <span className={`text-[8px] font-mono ${i <= idx ? 'text-zinc-400' : 'text-zinc-700'}`}>
              {stage.slice(0, 4)}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div className={`h-px flex-1 w-6 ${i < idx ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
export const MissionCommandCenter: React.FC<Props> = ({ nodes }) => {
  const missions = useQuery(api.queries.missions.getAll) ?? [];
  const activeMissions = missions.filter(m => m.status !== 'COMPLETE');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = missions.find(m => m.missionId === selectedId) ?? activeMissions[0] ?? null;
  const simulateMission = useAction(api.actions.triggerMission.simulateMission);
  const [simNode, setSimNode] = useState('');
  const [simType, setSimType] = useState<'FIRE_RESPONSE' | 'RECON' | 'PATROL'>('RECON');
  const [simRunning, setSimRunning] = useState(false);

  const handleSimulate = async () => {
    const target = simNode || nodes.find(n => n.status !== 'ONLINE')?.id || nodes[0]?.id;
    if (!target) return;
    setSimRunning(true);
    try { await simulateMission({ nodeId: target, missionType: simType }); }
    finally { setSimRunning(false); }
  };

  return (
    <div className="flex flex-col h-full bg-[#050507]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#1e1e24]">
        <div className="flex items-center gap-3">
          <Rocket className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-tight">Mission Command Center</h2>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-zinc-500">{activeMissions.length} ACTIVE</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-600">{missions.filter(m => m.status === 'COMPLETE').length} COMPLETE</span>
        </div>
      </div>

      {/* Sim toolbar */}
      <div className="flex items-center gap-2 px-6 py-2 border-b border-[#1e1e24] bg-[#0a0a0c]">
        <Play className="w-3 h-3 text-zinc-500" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase mr-2">Simulate</span>
        <select
          value={simNode}
          onChange={e => setSimNode(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono rounded px-2 py-1"
        >
          <option value="">Auto-pick degraded node</option>
          {nodes.map(n => <option key={n.id} value={n.id}>{n.id} — {n.name}</option>)}
        </select>
        <select
          value={simType}
          onChange={e => setSimType(e.target.value as any)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono rounded px-2 py-1"
        >
          <option value="RECON">RECON</option>
          <option value="FIRE_RESPONSE">FIRE RESPONSE</option>
          <option value="PATROL">PATROL</option>
        </select>
        <button
          onClick={handleSimulate}
          disabled={simRunning}
          className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-[10px] font-bold text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-40 uppercase tracking-wider"
        >
          {simRunning ? 'Launching…' : 'Launch Mission'}
        </button>
      </div>

      {/* Main 2-col layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: D3 map */}
        <div className="flex-1 min-w-0 relative">
          <DroneMap nodes={nodes} missions={missions} />
          {activeMissions.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-zinc-700 font-mono text-xs">No active missions — agents standing by</p>
            </div>
          )}
        </div>

        {/* Right: mission list */}
        <div className="w-80 border-l border-[#1e1e24] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {missions.length === 0 && (
              <p className="text-zinc-600 text-xs font-mono p-4">No missions yet.</p>
            )}
            {missions.slice(0, 10).map(m => (
              <button
                key={m._id}
                onClick={() => setSelectedId(m.missionId)}
                className={`w-full text-left p-4 border-b border-[#1e1e24] transition-colors ${
                  selected?.missionId === m.missionId ? 'bg-blue-500/5' : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono uppercase" style={{ color: STATUS_COLOR[m.status] ?? '#71717a' }}>
                    {m.status}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-600">{m.type}</span>
                </div>
                <p className="text-xs font-semibold text-zinc-200 truncate">{m.title}</p>
                <div className="mt-2 w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${m.progress}%`, background: STATUS_COLOR[m.status] ?? '#71717a' }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] font-mono text-zinc-600">{m.assets.length} assets</span>
                  <span className="text-[8px] font-mono text-zinc-500">{m.progress}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom panel: timeline + assets + robot feed */}
      {selected && (
        <div className="border-t border-[#1e1e24] p-4 space-y-4 bg-[#0a0a0c]">
          {/* Timeline */}
          <div>
            <p className="text-[9px] font-mono text-zinc-500 uppercase mb-2">Mission Timeline — {selected.title}</p>
            <MissionTimeline status={selected.status} />
          </div>

          {/* Asset roster */}
          <div>
            <p className="text-[9px] font-mono text-zinc-500 uppercase mb-2">Asset Roster</p>
            <div className="flex flex-wrap gap-2">
              {selected.assets.map((asset: any) => (
                <div key={asset.assetId} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-mono">
                  <span>{ASSET_ICON[asset.type] ?? '●'}</span>
                  <span className="text-zinc-300">{asset.name}</span>
                  <span className={
                    asset.status === 'ACTIVE' ? 'text-emerald-400' :
                    asset.status === 'OFFLINE' ? 'text-red-400' : 'text-zinc-600'
                  }>{asset.status}</span>
                  <Battery className="w-3 h-3 text-zinc-600" />
                  <span className="text-zinc-500">{asset.batteryPercent}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Robot feed */}
          <div>
            <p className="text-[9px] font-mono text-zinc-500 uppercase mb-2">Robot Feed (Jetson via Tailscale)</p>
            <RobotFeed />
          </div>
        </div>
      )}
    </div>
  );
};
