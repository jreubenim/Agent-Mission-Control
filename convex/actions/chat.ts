"use node";
import { action } from "../_generated/server";
import { internal, api } from "../_generated/api";
import { v } from "convex/values";

// Public action called from the frontend ChatPanel
export const sendMessage = action({
  args: {
    sessionId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, { sessionId, content }) => {
    // Save user message
    await ctx.runMutation(api.mutations.chatMessages.addMessage, {
      sessionId,
      role: "user",
      content,
    });

    // Build history for context (last 20 messages)
    const history: any[] = await ctx.runQuery(api.queries.chatMessages.getBySession, { sessionId });
    const messages = history
      .slice(-20)
      .map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content }))
      .filter((m: any) => m.role !== "system");

    // Build live dashboard context from Convex data
    const nodes: any[] = await ctx.runQuery(api.queries.nodes.getAll, {});
    const agents: any[] = await ctx.runQuery(api.queries.agents.getAll, {});
    const activeAlerts: any[] = await ctx.runQuery(api.queries.alerts.getActive, {});

    const online = nodes.filter((n: any) => n.status === "ONLINE").length;
    const degraded = nodes.filter((n: any) => n.status === "DEGRADED");
    const offline = nodes.filter((n: any) => n.status === "OFFLINE");
    const surge = nodes.filter((n: any) => n.status === "SURGE");
    const activeAgents = agents.filter((a: any) => a.status === "ACTIVE");

    const contextLines = [
      `[LIVE DASHBOARD] ${nodes.length} nodes: ${online} ONLINE, ${degraded.length} DEGRADED, ${offline.length} OFFLINE, ${surge.length} SURGE.`,
    ];
    if (degraded.length || offline.length) {
      const problems = [...degraded, ...offline];
      contextLines.push(`Problem nodes: ${problems.map((n: any) => `${n.nodeId} (${n.name}) ${n.status}`).join("; ")}.`);
    }
    if (activeAlerts.length) {
      contextLines.push(`Active alerts: ${activeAlerts.length} — ${activeAlerts.map((a: any) => a.title).slice(0, 5).join("; ")}.`);
    }
    if (activeAgents.length) {
      contextLines.push(`Active agents: ${activeAgents.map((a: any) => `${a.agentId} (${a.currentTask ?? a.role})`).join("; ")}.`);
    }

    const contextSummary = contextLines.join(" ");

    // Call DeepSeek server-side
    const reply: string = await ctx.runAction(internal.actions.deepseek.callDeepSeek, {
      messages,
      contextSummary,
    });

    // Save assistant reply
    await ctx.runMutation(api.mutations.chatMessages.addMessage, {
      sessionId,
      role: "assistant",
      content: reply,
    });

    return reply;
  },
});
