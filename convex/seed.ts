import { mutation } from "./_generated/server";

const SEED_NODES = [
  { nodeId: "D-CC-01", name: "London Central Control", type: "DOMESTIC" as const, status: "ONLINE" as const, location: { lat: 51.5074, lng: -0.1278 }, telemetry: { signalStrength: 98, latency: 2, bandwidth: 1000, cpuLoad: 42 } },
  { nodeId: "D-CC-02", name: "Paris Operations Hub", type: "DOMESTIC" as const, status: "ONLINE" as const, location: { lat: 48.8566, lng: 2.3522 }, telemetry: { signalStrength: 97, latency: 3, bandwidth: 950, cpuLoad: 38 } },
  { nodeId: "D-ST-01", name: "Berlin Relay Station", type: "DOMESTIC" as const, status: "ONLINE" as const, location: { lat: 52.5200, lng: 13.4050 }, telemetry: { signalStrength: 96, latency: 4, bandwidth: 900, cpuLoad: 35 } },
  { nodeId: "D-ST-02", name: "Brussels Command Node", type: "DOMESTIC" as const, status: "ONLINE" as const, location: { lat: 50.8503, lng: 4.3517 }, telemetry: { signalStrength: 95, latency: 3, bandwidth: 850, cpuLoad: 30 } },
  { nodeId: "D-ST-03", name: "Amsterdam Data Center", type: "DOMESTIC" as const, status: "ONLINE" as const, location: { lat: 52.3676, lng: 4.9041 }, telemetry: { signalStrength: 96, latency: 4, bandwidth: 920, cpuLoad: 44 } },
  { nodeId: "D-ST-04", name: "Frankfurt Uplink", type: "DOMESTIC" as const, status: "SURGE" as const, location: { lat: 50.1109, lng: 8.6821 }, telemetry: { signalStrength: 94, latency: 5, bandwidth: 880, cpuLoad: 62 } },
  { nodeId: "D-ST-05", name: "Munich Ground Station", type: "DOMESTIC" as const, status: "ONLINE" as const, location: { lat: 48.1351, lng: 11.5820 }, telemetry: { signalStrength: 93, latency: 6, bandwidth: 800, cpuLoad: 28 } },
  { nodeId: "D-ST-06", name: "Rome Tactical Node", type: "DOMESTIC" as const, status: "ONLINE" as const, location: { lat: 41.9028, lng: 12.4964 }, telemetry: { signalStrength: 92, latency: 7, bandwidth: 750, cpuLoad: 33 } },
  { nodeId: "O-ST-01", name: "Madrid Forward Base", type: "OVERSEAS" as const, status: "ONLINE" as const, location: { lat: 40.4168, lng: -3.7038 }, telemetry: { signalStrength: 88, latency: 10, bandwidth: 400, cpuLoad: 36 } },
  { nodeId: "O-ST-02", name: "Warsaw Eastern Post", type: "OVERSEAS" as const, status: "DEGRADED" as const, location: { lat: 52.2297, lng: 21.0122 }, telemetry: { signalStrength: 82, latency: 14, bandwidth: 300, cpuLoad: 48 } },
  { nodeId: "O-ST-03", name: "Bucharest Outpost", type: "OVERSEAS" as const, status: "ONLINE" as const, location: { lat: 44.4268, lng: 26.1025 }, telemetry: { signalStrength: 80, latency: 16, bandwidth: 250, cpuLoad: 41 } },
  { nodeId: "O-ST-04", name: "Stockholm Nordic Relay", type: "OVERSEAS" as const, status: "ONLINE" as const, location: { lat: 59.3293, lng: 18.0686 }, telemetry: { signalStrength: 86, latency: 12, bandwidth: 350, cpuLoad: 29 } },
  { nodeId: "O-ST-05", name: "Athens Mediterranean Post", type: "OVERSEAS" as const, status: "OFFLINE" as const, location: { lat: 37.9838, lng: 23.7275 }, telemetry: { signalStrength: 0, latency: 0, bandwidth: 0, cpuLoad: 0 } },
  { nodeId: "O-ST-06", name: "Istanbul Gateway", type: "OVERSEAS" as const, status: "SURGE" as const, location: { lat: 41.0082, lng: 28.9784 }, telemetry: { signalStrength: 84, latency: 18, bandwidth: 280, cpuLoad: 58 } },
  { nodeId: "M-SH-01", name: "North Sea Patrol", type: "MARITIME" as const, status: "ONLINE" as const, location: { lat: 56.0, lng: 3.0 }, telemetry: { signalStrength: 78, latency: 22, bandwidth: 150, cpuLoad: 52 } },
  { nodeId: "M-SH-02", name: "Mediterranean Sentinel", type: "MARITIME" as const, status: "ONLINE" as const, location: { lat: 38.0, lng: 15.0 }, telemetry: { signalStrength: 76, latency: 25, bandwidth: 120, cpuLoad: 48 } },
  { nodeId: "M-SH-03", name: "Baltic Guardian", type: "MARITIME" as const, status: "DEGRADED" as const, location: { lat: 57.5, lng: 19.5 }, telemetry: { signalStrength: 72, latency: 28, bandwidth: 100, cpuLoad: 55 } },
  { nodeId: "M-SH-04", name: "English Channel Watch", type: "MARITIME" as const, status: "ONLINE" as const, location: { lat: 50.2, lng: 0.5 }, telemetry: { signalStrength: 85, latency: 15, bandwidth: 180, cpuLoad: 38 } },
  { nodeId: "M-SH-05", name: "Adriatic Monitor", type: "MARITIME" as const, status: "ONLINE" as const, location: { lat: 42.5, lng: 16.0 }, telemetry: { signalStrength: 74, latency: 24, bandwidth: 110, cpuLoad: 44 } },
  { nodeId: "M-SH-06", name: "Norwegian Sea Tracker", type: "MARITIME" as const, status: "ONLINE" as const, location: { lat: 64.0, lng: 5.0 }, telemetry: { signalStrength: 70, latency: 30, bandwidth: 90, cpuLoad: 50 } },
  { nodeId: "S-SA-01", name: "GEO-EUR-1 Geostationary", type: "SPACE" as const, status: "ONLINE" as const, location: { lat: 47.0, lng: 10.0 }, telemetry: { signalStrength: 99, latency: 240, bandwidth: 2000, cpuLoad: 12 } },
  { nodeId: "S-SA-02", name: "GEO-EUR-2 Geostationary", type: "SPACE" as const, status: "ONLINE" as const, location: { lat: 45.0, lng: -5.0 }, telemetry: { signalStrength: 98, latency: 245, bandwidth: 1800, cpuLoad: 15 } },
  { nodeId: "S-SA-03", name: "Polar Relay Alpha", type: "SPACE" as const, status: "ONLINE" as const, location: { lat: 70.0, lng: 25.0 }, telemetry: { signalStrength: 94, latency: 260, bandwidth: 1200, cpuLoad: 18 } },
  { nodeId: "S-SA-04", name: "Azores Uplink Station", type: "SPACE" as const, status: "ONLINE" as const, location: { lat: 38.7, lng: -27.2 }, telemetry: { signalStrength: 96, latency: 250, bandwidth: 1500, cpuLoad: 10 } },
  { nodeId: "S-SA-05", name: "Svalbard Arctic Ground", type: "SPACE" as const, status: "DEGRADED" as const, location: { lat: 78.2, lng: 15.6 }, telemetry: { signalStrength: 88, latency: 270, bandwidth: 800, cpuLoad: 22 } },
];

const SEED_AGENTS = [
  { agentId: "A-MON-DOMESTIC", name: "Domestic Monitor", role: "monitoring" as const, tier: 1 as const, segment: "DOMESTIC", status: "IDLE" as const },
  { agentId: "A-MON-OVERSEAS", name: "Overseas Monitor", role: "monitoring" as const, tier: 1 as const, segment: "OVERSEAS", status: "IDLE" as const },
  { agentId: "A-MON-MARITIME", name: "Maritime Monitor", role: "monitoring" as const, tier: 1 as const, segment: "MARITIME", status: "IDLE" as const },
  { agentId: "A-MON-SPACE", name: "Space Monitor", role: "monitoring" as const, tier: 1 as const, segment: "SPACE", status: "IDLE" as const },
  { agentId: "A-RAPID-01", name: "Rapid Response Command", role: "rapid_response" as const, tier: 2 as const, status: "IDLE" as const, parentAgentId: undefined },
  { agentId: "A-FLEET-01", name: "Fleet Deployment Control", role: "fleet_deployment" as const, tier: 3 as const, status: "IDLE" as const, parentAgentId: undefined },
];

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingNodes = await ctx.db.query("nodes").first();
    if (existingNodes) {
      return { status: "already_seeded" };
    }

    // Insert nodes
    for (const node of SEED_NODES) {
      await ctx.db.insert("nodes", {
        ...node,
        alarmActive: false,
        powerRouting: undefined,
      });
    }

    // Insert agents
    for (const agent of SEED_AGENTS) {
      await ctx.db.insert("agents", {
        ...agent,
        lastRunAt: undefined,
        currentTask: undefined,
        config: undefined,
      });
    }

    return { status: "seeded", nodes: SEED_NODES.length, agents: SEED_AGENTS.length };
  },
});
