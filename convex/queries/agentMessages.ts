import { query } from "../_generated/server";
import { v } from "convex/values";

export const getForAgent = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_messages")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.agentId).eq("acknowledged", false))
      .collect();
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agent_messages")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agent_messages").order("desc").take(200);
  },
});
