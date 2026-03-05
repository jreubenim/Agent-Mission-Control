import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    sessionId: v.string(),
    type: v.union(v.literal("gps"), v.literal("accelerometer"), v.literal("incident")),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Rate limiting: max 1 reading per second per session
    const recent = await ctx.db
      .query("sensor_readings")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .order("desc")
      .first();

    if (recent && Date.now() - recent.timestamp < 1000) {
      return null; // rate limited
    }

    return await ctx.db.insert("sensor_readings", {
      ...args,
      processed: false,
      timestamp: Date.now(),
    });
  },
});

export const markProcessed = mutation({
  args: { ids: v.array(v.id("sensor_readings")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.patch(id, { processed: true });
    }
  },
});
