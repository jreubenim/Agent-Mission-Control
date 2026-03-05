import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const insert = mutation({
  args: {
    nodeId: v.string(),
    signalStrength: v.number(),
    latency: v.number(),
    bandwidth: v.number(),
    cpuLoad: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("telemetry_events", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
