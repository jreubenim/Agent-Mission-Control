import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const addMessage = mutation({
  args: {
    sessionId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chat_messages", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
