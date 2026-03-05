import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    code: v.string(),
    deviceInfo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sensor_sessions")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "active",
        lastHeartbeat: Date.now(),
        deviceInfo: args.deviceInfo,
      });
      return existing._id;
    }
    return await ctx.db.insert("sensor_sessions", {
      code: args.code,
      deviceInfo: args.deviceInfo,
      status: "active",
      lastHeartbeat: Date.now(),
      createdAt: Date.now(),
    });
  },
});

export const heartbeat = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sensor_sessions")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (session) {
      await ctx.db.patch(session._id, { lastHeartbeat: Date.now() });
    }
  },
});

export const disconnect = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sensor_sessions")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .first();
    if (session) {
      await ctx.db.patch(session._id, { status: "disconnected" });
    }
  },
});
