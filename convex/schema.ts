import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  nodes: defineTable({
    nodeId: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("DOMESTIC"),
      v.literal("OVERSEAS"),
      v.literal("MARITIME"),
      v.literal("SPACE")
    ),
    status: v.union(
      v.literal("ONLINE"),
      v.literal("OFFLINE"),
      v.literal("DEGRADED"),
      v.literal("SURGE")
    ),
    location: v.object({ lat: v.number(), lng: v.number() }),
    telemetry: v.object({
      signalStrength: v.number(),
      latency: v.number(),
      bandwidth: v.number(),
      cpuLoad: v.number(),
    }),
    alarmActive: v.boolean(),
    powerRouting: v.optional(v.string()),
  })
    .index("by_nodeId", ["nodeId"])
    .index("by_segment", ["type"])
    .index("by_status", ["status"]),

  agents: defineTable({
    agentId: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("monitoring"),
      v.literal("rapid_response"),
      v.literal("fleet_deployment")
    ),
    tier: v.union(v.literal(1), v.literal(2), v.literal(3)),
    segment: v.optional(v.string()),
    status: v.union(
      v.literal("IDLE"),
      v.literal("ACTIVE"),
      v.literal("ERROR")
    ),
    parentAgentId: v.optional(v.string()),
    lastRunAt: v.optional(v.number()),
    currentTask: v.optional(v.string()),
    config: v.optional(v.any()),
  })
    .index("by_agentId", ["agentId"])
    .index("by_role", ["role"])
    .index("by_segment", ["segment"]),

  telemetry_events: defineTable({
    nodeId: v.string(),
    timestamp: v.number(),
    signalStrength: v.number(),
    latency: v.number(),
    bandwidth: v.number(),
    cpuLoad: v.number(),
  }).index("by_node_time", ["nodeId", "timestamp"]),

  sigint_events: defineTable({
    eventId: v.string(),
    timestamp: v.number(),
    frequency: v.string(),
    location: v.object({ lat: v.number(), lng: v.number() }),
    confidence: v.number(),
    type: v.union(
      v.literal("EMISSION"),
      v.literal("INTERCEPT"),
      v.literal("GEOLOCATION")
    ),
  }).index("by_time", ["timestamp"]),

  chat_messages: defineTable({
    sessionId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    timestamp: v.number(),
  }).index("by_session", ["sessionId", "timestamp"]),

  agent_messages: defineTable({
    senderId: v.string(),
    recipientId: v.string(),
    type: v.union(
      v.literal("alert"),
      v.literal("order"),
      v.literal("status"),
      v.literal("ack"),
      v.literal("report")
    ),
    payload: v.any(),
    acknowledged: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_recipient", ["recipientId", "acknowledged"])
    .index("by_sender", ["senderId", "timestamp"]),

  sensor_readings: defineTable({
    sessionId: v.string(),
    type: v.union(
      v.literal("gps"),
      v.literal("accelerometer"),
      v.literal("incident")
    ),
    data: v.any(),
    processed: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_session", ["sessionId", "timestamp"])
    .index("by_unprocessed", ["processed", "timestamp"]),

  alerts: defineTable({
    nodeId: v.optional(v.string()),
    agentId: v.string(),
    severity: v.union(
      v.literal("INFO"),
      v.literal("WARNING"),
      v.literal("CRITICAL"),
      v.literal("EMERGENCY")
    ),
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("acknowledged"),
      v.literal("resolved")
    ),
    timestamp: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_status", ["status", "timestamp"])
    .index("by_node", ["nodeId", "timestamp"]),

  missions: defineTable({
    missionId: v.string(),
    title: v.string(),
    type: v.union(
      v.literal("FIRE_RESPONSE"),
      v.literal("RECON"),
      v.literal("SEARCH_RESCUE"),
      v.literal("PATROL"),
      v.literal("EMERGENCY")
    ),
    status: v.union(
      v.literal("PLANNING"),
      v.literal("DEPLOYING"),
      v.literal("ACTIVE"),
      v.literal("SCANNING"),
      v.literal("RETURNING"),
      v.literal("COMPLETE")
    ),
    targetNodeId: v.optional(v.string()),
    targetLocation: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    baseLocation: v.object({ lat: v.number(), lng: v.number() }),
    assets: v.array(
      v.object({
        assetId: v.string(),
        type: v.union(
          v.literal("drone"),
          v.literal("robot"),
          v.literal("swarm")
        ),
        name: v.string(),
        status: v.union(
          v.literal("STANDBY"),
          v.literal("ACTIVE"),
          v.literal("RETURNING"),
          v.literal("OFFLINE")
        ),
        currentPosition: v.object({ lat: v.number(), lng: v.number() }),
        batteryPercent: v.number(),
      })
    ),
    progress: v.number(),
    estimatedDuration: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    alertId: v.optional(v.id("alerts")),
  })
    .index("by_status", ["status"])
    .index("by_node", ["targetNodeId"]),

  sensor_sessions: defineTable({
    code: v.string(),
    deviceInfo: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("disconnected")
    ),
    lastHeartbeat: v.number(),
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  hardware_sessions: defineTable({
    sessionId: v.string(),
    jetsonTailscaleIp: v.string(),
    sshUser: v.string(),
    status: v.union(
      v.literal("connected"),
      v.literal("disconnected"),
      v.literal("error")
    ),
    lastHeartbeat: v.number(),
    robotStatus: v.object({
      motorLeft: v.union(v.literal("on"), v.literal("off"), v.literal("error")),
      motorRight: v.union(v.literal("on"), v.literal("off"), v.literal("error")),
      lidarActive: v.boolean(),
      batteryPercent: v.optional(v.number()),
    }),
    lastLidarScan: v.optional(v.any()),
  }).index("by_status", ["status"]),
});
