"use node";
import { action, internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v } from "convex/values";

// ── SSH helper ────────────────────────────────────────────────────────────────
async function sshExec(ip: string, user: string, command: string): Promise<{ success: boolean; output: string }> {
  const { Client } = await import("ssh2");
  return new Promise((resolve) => {
    const conn = new Client();
    let output = "";
    conn
      .on("ready", () =>
        conn.exec(command, (err, stream) => {
          if (err) { conn.end(); return resolve({ success: false, output: err.message }); }
          stream
            .on("close", () => { conn.end(); resolve({ success: true, output }); })
            .on("data", (d: Buffer) => { output += d.toString(); })
            .stderr.on("data", (d: Buffer) => { output += d.toString(); });
        })
      )
      .on("error", (e) => resolve({ success: false, output: e.message }))
      .connect({
        host: ip,
        port: 22,
        username: user,
        // SSH key from Convex env var (base64-encoded PEM). Falls back to ssh-agent.
        privateKey: process.env.JETSON_SSH_KEY
          ? Buffer.from(process.env.JETSON_SSH_KEY, "base64").toString("utf8")
          : undefined,
        agent: process.env.SSH_AUTH_SOCK,
        readyTimeout: 8000,
      });
  });
}

function ros2Source(): string {
  return "source /opt/ros/humble/setup.bash && source ~/ros2_ws/install/setup.bash 2>/dev/null || true";
}

// ── Get active hardware session ───────────────────────────────────────────────
async function getActiveSession(ctx: any) {
  // Try env vars first (for friend/collab setups without a DB session)
  const envIp = process.env.JETSON_TAILSCALE_IP;
  const envUser = process.env.JETSON_SSH_USER ?? "jetson";
  if (envIp) return { ip: envIp, user: envUser, sessionId: "env" };

  const session: any = await ctx.runQuery(api.queries.hardwareSessions.getActive, {});
  if (!session) return null;
  return { ip: session.jetsonTailscaleIp, user: session.sshUser, sessionId: session.sessionId };
}

// ── Public actions (called from frontend) ────────────────────────────────────

// Register a new Jetson session from the UI (called when user enters Tailscale IP)
export const registerSession = action({
  args: {
    jetsonTailscaleIp: v.string(),
    sshUser: v.string(),
  },
  handler: async (ctx, { jetsonTailscaleIp, sshUser }) => {
    const sessionId = `jetson-${Date.now()}`;
    // Quick connectivity test before saving
    const test = await sshExec(jetsonTailscaleIp, sshUser, "echo OK");
    await ctx.runMutation(api.mutations.hardwareSessions.register, {
      sessionId,
      jetsonTailscaleIp,
      sshUser,
    });
    return { sessionId, reachable: test.success, output: test.output };
  },
});

export const haltRobot = action({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const conn = await getActiveSession(ctx);
    if (!conn) return { success: false, output: "No hardware session" };
    const cmd = `${ros2Source()} && ros2 service call /stop_robot std_srvs/srv/Trigger || ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist '{}'`;
    const result = await sshExec(conn.ip, conn.user, cmd);
    console.log(`[JETSON HALT] ${result.success ? "OK" : "FAIL"}: ${result.output.slice(0, 200)}`);
    return result;
  },
});

export const sendMotorCommand = action({
  args: {
    sessionId: v.string(),
    command: v.union(v.literal("forward"), v.literal("reverse"), v.literal("left"), v.literal("right"), v.literal("stop")),
  },
  handler: async (ctx, { sessionId, command }) => {
    const conn = await getActiveSession(ctx);
    if (!conn) return { success: false, output: "No hardware session" };

    const twist: Record<string, string> = {
      forward:  "'{linear: {x: 0.3, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}'",
      reverse:  "'{linear: {x: -0.3, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}'",
      left:     "'{linear: {x: 0.0, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.5}}'",
      right:    "'{linear: {x: 0.0, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: -0.5}}'",
      stop:     "'{linear: {x: 0.0, y: 0.0, z: 0.0}, angular: {x: 0.0, y: 0.0, z: 0.0}}'",
    };

    const cmd = `${ros2Source()} && ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist ${twist[command]}`;
    return sshExec(conn.ip, conn.user, cmd);
  },
});

export const getRobotStatus = action({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    const conn = await getActiveSession(ctx);
    if (!conn) return null;

    // Get battery and node list
    const cmd = `${ros2Source()} && ros2 node list 2>/dev/null | head -20`;
    const result = await sshExec(conn.ip, conn.user, cmd);

    // Parse what we can from output
    const nodes = result.output.split("\n").filter(Boolean);
    const lidarActive = nodes.some(n => n.includes("lidar") || n.includes("scan"));

    return {
      success: result.success,
      lidarActive,
      nodes,
      raw: result.output.slice(0, 500),
    };
  },
});

export const sendNavGoal = action({
  args: {
    sessionId: v.string(),
    lat: v.number(),
    lng: v.number(),
    missionType: v.string(),
  },
  handler: async (ctx, { sessionId, lat, lng, missionType }) => {
    const conn = await getActiveSession(ctx);
    if (!conn) return { success: false, output: "No hardware session" };

    const goalJson = JSON.stringify({
      header: { frame_id: "map" },
      pose: {
        position: { x: lng, y: lat, z: 0.0 },
        orientation: { x: 0, y: 0, z: 0, w: 1 },
      },
    });

    const navCmd = `ros2 topic pub --once /goal_pose geometry_msgs/msg/PoseStamped '${goalJson}'`;
    const missionCmd = missionType === "FIRE_RESPONSE"
      ? "ros2 service call /activate_firefighting std_srvs/srv/Trigger 2>/dev/null || true"
      : "ros2 service call /start_recon std_srvs/srv/Trigger 2>/dev/null || true";

    const cmd = `${ros2Source()} && ${navCmd} && ${missionCmd}`;
    return sshExec(conn.ip, conn.user, cmd);
  },
});

// ── Internal heartbeat (runs on cron) ─────────────────────────────────────────
export const heartbeat = internalAction({
  args: {},
  handler: async (ctx) => {
    const conn = await getActiveSession(ctx);
    if (!conn || conn.sessionId === "env") return;

    const result = await sshExec(conn.ip, conn.user, "uptime && hostname");
    const session: any = await ctx.runQuery(api.queries.hardwareSessions.getBySessionId, {
      sessionId: conn.sessionId,
    });
    if (!session) return;

    if (result.success) {
      await ctx.runMutation(api.mutations.hardwareSessions.updateHeartbeat, {
        sessionId: conn.sessionId,
        status: "connected",
      });
    } else {
      await ctx.runMutation(api.mutations.hardwareSessions.updateHeartbeat, {
        sessionId: conn.sessionId,
        status: "error",
      });
    }
  },
});
