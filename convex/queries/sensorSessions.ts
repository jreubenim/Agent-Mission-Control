import { query } from "../_generated/server";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("sensor_sessions").collect();
    return all.filter((s) => s.status === "active");
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("sensor_sessions").collect();
  },
});
