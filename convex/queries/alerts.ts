import { query } from "../_generated/server";
import { v } from "convex/values";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("alerts").order("desc").take(100);
  },
});

export const getByNode = query({
  args: { nodeId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_node", (q) => q.eq("nodeId", args.nodeId))
      .order("desc")
      .take(20);
  },
});

export const getActiveByNode = query({
  args: { nodeId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("alerts")
      .withIndex("by_node", (q) => q.eq("nodeId", args.nodeId))
      .collect();
    return all.filter((a) => a.status === "active");
  },
});
