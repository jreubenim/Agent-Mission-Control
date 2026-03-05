import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const register = mutation({
  args: {
    sessionId: v.string(),
    jetsonTailscaleIp: v.string(),
    sshUser: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hardware_sessions")
      .filter(q => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { status: "connected", lastHeartbeat: Date.now() });
      return existing._id;
    }
    return await ctx.db.insert("hardware_sessions", {
      ...args,
      status: "connected",
      lastHeartbeat: Date.now(),
      robotStatus: { motorLeft: "off", motorRight: "off", lidarActive: false },
    });
  },
});

export const updateHeartbeat = mutation({
  args: {
    sessionId: v.string(),
    status: v.union(v.literal("connected"), v.literal("disconnected"), v.literal("error")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("hardware_sessions")
      .filter(q => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    if (!session) return;
    await ctx.db.patch(session._id, { status: args.status, lastHeartbeat: Date.now() });
  },
});

export const updateRobotStatus = mutation({
  args: {
    sessionId: v.string(),
    robotStatus: v.object({
      motorLeft: v.union(v.literal("on"), v.literal("off"), v.literal("error")),
      motorRight: v.union(v.literal("on"), v.literal("off"), v.literal("error")),
      lidarActive: v.boolean(),
      batteryPercent: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("hardware_sessions")
      .filter(q => q.eq(q.field("sessionId"), args.sessionId))
      .first();
    if (!session) return;
    await ctx.db.patch(session._id, { robotStatus: args.robotStatus });
  },
});
