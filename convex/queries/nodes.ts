import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("nodes").collect();
  },
});

export const getBySegment = query({
  args: { segment: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nodes")
      .withIndex("by_segment", (q) => q.eq("type", args.segment as any))
      .collect();
  },
});

export const getById = query({
  args: { nodeId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("nodes")
      .withIndex("by_nodeId", (q) => q.eq("nodeId", args.nodeId))
      .first();
  },
});
