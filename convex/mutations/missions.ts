import { mutation } from "../_generated/server";
import { v } from "convex/values";

const assetValidator = v.object({
  assetId: v.string(),
  type: v.union(v.literal("drone"), v.literal("robot"), v.literal("swarm")),
  name: v.string(),
  status: v.union(v.literal("STANDBY"), v.literal("ACTIVE"), v.literal("RETURNING"), v.literal("OFFLINE")),
  currentPosition: v.object({ lat: v.number(), lng: v.number() }),
  batteryPercent: v.number(),
});

export const create = mutation({
  args: {
    missionId: v.string(),
    title: v.string(),
    type: v.union(v.literal("FIRE_RESPONSE"), v.literal("RECON"), v.literal("SEARCH_RESCUE"), v.literal("PATROL"), v.literal("EMERGENCY")),
    targetNodeId: v.optional(v.string()),
    targetLocation: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    baseLocation: v.object({ lat: v.number(), lng: v.number() }),
    assets: v.array(assetValidator),
    estimatedDuration: v.number(),
    alertId: v.optional(v.id("alerts")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("missions", {
      ...args,
      status: "PLANNING",
      progress: 0,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    missionId: v.string(),
    status: v.union(v.literal("PLANNING"), v.literal("DEPLOYING"), v.literal("ACTIVE"), v.literal("SCANNING"), v.literal("RETURNING"), v.literal("COMPLETE")),
    progress: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const missions = await ctx.db.query("missions").collect();
    const mission = missions.find((m) => m.missionId === args.missionId);
    if (!mission) throw new Error(`Mission ${args.missionId} not found`);
    const patch: any = { status: args.status };
    if (args.progress !== undefined) patch.progress = args.progress;
    if (args.status === "DEPLOYING" && !mission.startedAt) patch.startedAt = Date.now();
    if (args.status === "COMPLETE") patch.completedAt = Date.now();
    await ctx.db.patch(mission._id, patch);
  },
});

export const updateAssets = mutation({
  args: {
    missionId: v.string(),
    assets: v.array(assetValidator),
  },
  handler: async (ctx, args) => {
    const missions = await ctx.db.query("missions").collect();
    const mission = missions.find((m) => m.missionId === args.missionId);
    if (!mission) throw new Error(`Mission ${args.missionId} not found`);
    await ctx.db.patch(mission._id, { assets: args.assets });
  },
});
