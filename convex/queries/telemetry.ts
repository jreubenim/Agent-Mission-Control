import { query } from "../_generated/server";
import { v } from "convex/values";

export const getHistory = query({
  args: { nodeId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("telemetry_events")
      .withIndex("by_node_time", (q) => q.eq("nodeId", args.nodeId))
      .order("desc")
      .take(args.limit ?? 20);
  },
});

export const getRecentForAll = query({
  args: {},
  handler: async (ctx) => {
    const nodes = await ctx.db.query("nodes").collect();
    const result: Record<string, any[]> = {};
    for (const node of nodes) {
      result[node.nodeId] = await ctx.db
        .query("telemetry_events")
        .withIndex("by_node_time", (q) => q.eq("nodeId", node.nodeId))
        .order("desc")
        .take(10);
    }
    return result;
  },
});
