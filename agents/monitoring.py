"""
Tier-1 Monitoring Agent — one per network segment.
sense: reads node telemetry + unprocessed sensor readings
think: asks DeepSeek to identify anomalies and severity
act:   creates alerts, marks sensor readings processed
communicate: notifies Rapid Response on severity >= CRITICAL
"""
import json
import logging
from base import ZeroClawAgent, SensoryInput, Decision
from convex_client import ConvexClient

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a network anomaly detection AI for the G-TT&C surveillance network.
You receive telemetry from a segment of nodes and decide whether to raise alerts.

Always respond with valid JSON matching this schema:
{
  "anomalies": [
    {
      "nodeId": "<string>",
      "severity": "INFO" | "WARNING" | "CRITICAL" | "EMERGENCY",
      "title": "<short title>",
      "description": "<1-2 sentences>",
      "action": "monitor" | "raise_alert" | "escalate"
    }
  ],
  "summary": "<one line summary of segment health>"
}

Severity guide:
- INFO: minor jitter, keep watching
- WARNING: degraded signal or high CPU, flag it
- CRITICAL: near-offline, offline, or multiple simultaneous failures
- EMERGENCY: full blackout, suspected intrusion, cascading failure

Only flag nodes that genuinely need attention. Healthy nodes should produce no anomalies."""


class MonitoringAgent(ZeroClawAgent):
    TIER = 1
    ROLE = "monitoring"

    def __init__(self, agent_id: str, segment: str, convex: ConvexClient):
        super().__init__(agent_id, convex)
        self.segment = segment

    async def sense(self) -> SensoryInput:
        await self._set_task(f"Scanning {self.segment} nodes")
        nodes = await self.convex.query("queries/nodes:getBySegment", {"segment": self.segment})
        sensors = []
        try:
            sensors = await self.convex.query("queries/sensorSessions:getActive", {})
        except Exception:
            pass
        return SensoryInput(data={"nodes": nodes, "sensors": sensors, "segment": self.segment})

    async def think(self, input: SensoryInput) -> Decision:
        nodes = input.data["nodes"]
        if not nodes:
            return Decision("no_op", reasoning="No nodes in segment")

        # Format telemetry for the LLM
        node_lines = []
        for n in nodes:
            t = n.get("telemetry", {})
            node_lines.append(
                f"  {n['nodeId']} ({n['name']}) status={n['status']} "
                f"signal={t.get('signalStrength','?')}% latency={t.get('latency','?')}ms "
                f"cpu={t.get('cpuLoad','?')}% bandwidth={t.get('bandwidth','?')}Mbps"
            )

        user_msg = (
            f"Segment: {self.segment}\n"
            f"Nodes ({len(nodes)}):\n" + "\n".join(node_lines) + "\n\n"
            f"Identify anomalies and decide what action to take."
        )

        raw = await self.ask_deepseek(SYSTEM_PROMPT, user_msg, json_mode=True)
        parsed = json.loads(raw)
        anomalies = parsed.get("anomalies", [])

        if not anomalies:
            return Decision("no_op", reasoning=parsed.get("summary", "All clear"))

        return Decision(
            action_type="raise_alerts",
            payload={"anomalies": anomalies, "summary": parsed.get("summary", "")},
            reasoning=parsed.get("summary", ""),
        )

    async def act(self, decision: Decision) -> None:
        anomalies = decision.payload.get("anomalies", [])
        created = []
        for anomaly in anomalies:
            if anomaly.get("action") == "monitor":
                continue
            # Deduplicate — skip if active alert already exists
            existing = await self.convex.query(
                "queries/alerts:getActiveByNode", {"nodeId": anomaly["nodeId"]}
            )
            if existing:
                continue
            alert_id = await self.convex.mutation("mutations/alerts:create", {
                "nodeId": anomaly["nodeId"],
                "agentId": self.agent_id,
                "severity": anomaly["severity"],
                "title": anomaly["title"],
                "description": anomaly["description"],
            })
            created.append({"alertId": alert_id, **anomaly})
            log.info(f"[{self.agent_id}] Alert created: {anomaly['severity']} — {anomaly['title']}")

        decision.payload["created_alerts"] = created

    async def communicate(self, decision: Decision) -> None:
        escalate = [
            a for a in decision.payload.get("created_alerts", [])
            if a["severity"] in ("CRITICAL", "EMERGENCY")
        ]
        for alert in escalate:
            await self._send_ipc("A-RAPID-01", "alert", {
                "nodeId":   alert["nodeId"],
                "alertId":  alert["alertId"],
                "severity": alert["severity"],
                "title":    alert["title"],
                "segment":  self.segment,
            })
            log.info(f"[{self.agent_id}] → Escalated {alert['severity']} to A-RAPID-01")
