"use node";
import { internalAction } from "../_generated/server";
import { v } from "convex/values";

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

const SYSTEM_PROMPT = `You are an AI mission analyst embedded in the G-TT&C (Global Tracking, Telemetry & Command) Mission Control dashboard. You have access to real-time data about a network of surveillance and communications nodes spread across Europe.

Segments: DOMESTIC (London, Paris, Berlin, Brussels, Amsterdam, Frankfurt, Munich, Rome), OVERSEAS (Madrid, Warsaw, Bucharest, Stockholm, Athens, Istanbul), MARITIME (North Sea, Mediterranean, Baltic, English Channel, Adriatic, Norwegian Sea), SPACE (GEO satellites, polar relays, Azores, Svalbard uplinks).

Help operators analyze node status, telemetry anomalies, coverage gaps, and tactical responses. Be concise and use military/intelligence-style brevity. Reference specific node IDs when relevant.`;

export interface DeepSeekMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export const callDeepSeek = internalAction({
  args: {
    messages: v.array(v.object({ role: v.string(), content: v.string() })),
    contextSummary: v.optional(v.string()),
  },
  handler: async (_ctx, { messages, contextSummary }) => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return "[COMMS OFFLINE] DEEPSEEK_API_KEY not set.";

    const systemContent = contextSummary
      ? `${SYSTEM_PROMPT}\n\n${contextSummary}`
      : SYSTEM_PROMPT;

    const payload = {
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemContent },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    };

    const res = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`DeepSeek error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return (data.choices?.[0]?.message?.content as string) ?? "[No response]";
  },
});
