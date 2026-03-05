import { query } from "../_generated/server";
import { v } from "convex/values";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("hardware_sessions")
      .withIndex("by_status", (q) => q.eq("status", "connected"))
      .first();
  },
});

export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("hardware_sessions").collect();
    return all.find((s) => s.sessionId === args.sessionId) ?? null;
  },
});
