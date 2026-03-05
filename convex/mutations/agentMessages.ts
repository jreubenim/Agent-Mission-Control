import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const send = mutation({
  args: {
    senderId: v.string(),
    recipientId: v.string(),
    type: v.union(v.literal("alert"), v.literal("order"), v.literal("status"), v.literal("ack"), v.literal("report")),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agent_messages", {
      ...args,
      acknowledged: false,
      timestamp: Date.now(),
    });
  },
});

export const acknowledge = mutation({
  args: { messageId: v.id("agent_messages") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { acknowledged: true });
  },
});
