import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateStatus = mutation({
  args: { nodeId: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    const node = await ctx.db
      .query("nodes")
      .withIndex("by_nodeId", (q) => q.eq("nodeId", args.nodeId))
      .first();
    if (!node) throw new Error(`Node ${args.nodeId} not found`);
    await ctx.db.patch(node._id, { status: args.status as any });
  },
});

export const updateTelemetry = mutation({
  args: {
    nodeId: v.string(),
    telemetry: v.object({
      signalStrength: v.number(),
      latency: v.number(),
      bandwidth: v.number(),
      cpuLoad: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const node = await ctx.db
      .query("nodes")
      .withIndex("by_nodeId", (q) => q.eq("nodeId", args.nodeId))
      .first();
    if (!node) throw new Error(`Node ${args.nodeId} not found`);
    await ctx.db.patch(node._id, { telemetry: args.telemetry });
  },
});

export const toggleAlarm = mutation({
  args: { nodeId: v.string(), active: v.boolean() },
  handler: async (ctx, args) => {
    const node = await ctx.db
      .query("nodes")
      .withIndex("by_nodeId", (q) => q.eq("nodeId", args.nodeId))
      .first();
    if (!node) throw new Error(`Node ${args.nodeId} not found`);
    await ctx.db.patch(node._id, { alarmActive: args.active });
  },
});

export const setPowerRouting = mutation({
  args: { nodeId: v.string(), routing: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const node = await ctx.db
      .query("nodes")
      .withIndex("by_nodeId", (q) => q.eq("nodeId", args.nodeId))
      .first();
    if (!node) throw new Error(`Node ${args.nodeId} not found`);
    await ctx.db.patch(node._id, { powerRouting: args.routing });
  },
});
