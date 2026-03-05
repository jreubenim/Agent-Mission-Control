"use node";
import { internalAction } from "../_generated/server";
import { api } from "../_generated/api";

// Realistic jitter: small random walk within bounds
function jitter(value: number, range: number, min: number, max: number): number {
  const delta = (Math.random() - 0.5) * 2 * range;
  return Math.max(min, Math.min(max, Math.round((value + delta) * 10) / 10));
}

// Occasionally degrade a random node to trigger monitoring agents
function shouldDegrade(): boolean {
  return Math.random() < 0.04; // ~4% chance per node per tick
}
function shouldRecover(): boolean {
  return Math.random() < 0.3; // 30% chance degraded node recovers per tick
}

export const tick = internalAction({
  args: {},
  handler: async (ctx) => {
    const nodes: any[] = await ctx.runQuery(api.queries.nodes.getAll, {});

    for (const node of nodes) {
      const t = node.telemetry;
      let newStatus = node.status;

      // Recovery logic: degraded/surge nodes have a chance to recover
      if (node.status === "DEGRADED" && shouldRecover()) {
        newStatus = "ONLINE";
      } else if (node.status === "SURGE" && shouldRecover()) {
        newStatus = "ONLINE";
      } else if (node.status === "ONLINE" && shouldDegrade()) {
        // Randomly pick a degradation type
        newStatus = Math.random() < 0.5 ? "DEGRADED" : "SURGE";
      }
      // OFFLINE nodes never auto-recover (require manual intervention)

      const newTelemetry = {
        signalStrength: jitter(t.signalStrength, 2, 0, 100),
        latency: jitter(t.latency, 3, 1, 500),
        bandwidth: jitter(t.bandwidth, 20, 0, 2000),
        cpuLoad: jitter(t.cpuLoad, 5, 0, 100),
      };

      // Reflect degraded status in telemetry
      if (newStatus === "DEGRADED") {
        newTelemetry.signalStrength = Math.min(newTelemetry.signalStrength, 75);
        newTelemetry.latency = Math.max(newTelemetry.latency, 50);
      } else if (newStatus === "SURGE") {
        newTelemetry.cpuLoad = Math.max(newTelemetry.cpuLoad, 70);
        newTelemetry.bandwidth = Math.max(newTelemetry.bandwidth, 800);
      }

      await ctx.runMutation(api.mutations.nodes.updateTelemetry, {
        nodeId: node.nodeId,
        telemetry: newTelemetry,
      });

      if (newStatus !== node.status) {
        await ctx.runMutation(api.mutations.nodes.updateStatus, {
          nodeId: node.nodeId,
          status: newStatus,
        });
      }

      // Write historical record
      await ctx.runMutation(api.mutations.telemetryEvents.insert, {
        nodeId: node.nodeId,
        ...newTelemetry,
      });
    }
  },
});
