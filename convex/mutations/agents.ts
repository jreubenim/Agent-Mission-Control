import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const updateStatus = mutation({
  args: { agentId: v.string(), status: v.string() },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!agent) throw new Error(`Agent ${args.agentId} not found`);
    await ctx.db.patch(agent._id, { status: args.status as any });
  },
});

export const updateTask = mutation({
  args: { agentId: v.string(), currentTask: v.optional(v.string()), lastRunAt: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
    if (!agent) throw new Error(`Agent ${args.agentId} not found`);
    const patch: any = {};
    if (args.currentTask !== undefined) patch.currentTask = args.currentTask;
    if (args.lastRunAt !== undefined) patch.lastRunAt = args.lastRunAt;
    await ctx.db.patch(agent._id, patch);
  },
});
