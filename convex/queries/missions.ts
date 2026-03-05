import { query } from "../_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("missions").order("desc").take(50);
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("missions").collect();
    return all.filter((m) => m.status !== "COMPLETE");
  },
});

export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("missions")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .collect();
  },
});
