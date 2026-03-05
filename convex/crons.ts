import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Telemetry simulator — jitters node readings every 10s, occasionally degrades nodes
// NOTE: ZeroClaw Python agents (agents/) handle all AI agent logic.
//       Convex only runs infrastructure tasks (telemetry simulation, Jetson heartbeat).
crons.interval(
  "simulate-telemetry",
  { seconds: 10 },
  internal.actions.simulateTelemetry.tick
);

// Robot heartbeat — ping Jetson over Tailscale every 10s
crons.interval(
  "jetson-heartbeat",
  { seconds: 10 },
  internal.actions.jetsonBridge.heartbeat
);

export default crons;
