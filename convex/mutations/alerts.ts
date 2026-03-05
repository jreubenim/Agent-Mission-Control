import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    nodeId: v.optional(v.string()),
    agentId: v.string(),
    severity: v.union(v.literal("INFO"), v.literal("WARNING"), v.literal("CRITICAL"), v.literal("EMERGENCY")),
    title: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alerts", {
      ...args,
      status: "active",
      timestamp: Date.now(),
    });
  },
});

export const acknowledge = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { status: "acknowledged" });
  },
});

export const resolve = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { status: "resolved", resolvedAt: Date.now() });
  },
});
