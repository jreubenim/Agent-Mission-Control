"""
Tier-2 Rapid Response Agent.
sense:       reads unacked IPC from monitors + active alerts + affected node state
think:       asks DeepSeek: notify emergency services? reroute power? deploy fleet?
act:         toggles alarms, reroutes power, creates external notifications
communicate: orders Fleet Deployment and acks Tier-1 messages
"""
import json
import logging
from base import ZeroClawAgent, SensoryInput, Decision
from convex_client import ConvexClient

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Rapid Response Commander for the G-TT&C surveillance network.
You receive escalated alerts from monitoring agents and decide how to respond.

Always respond with valid JSON:
{
  "response_plan": {
    "toggle_alarms": ["<nodeId>", ...],
    "reroute_power": [{"nodeId": "<id>", "routing": "<target_nodeId>"}, ...],
    "notify_emergency": true | false,
    "deploy_fleet": true | false,
    "fleet_mission_type": "FIRE_RESPONSE" | "RECON" | "SEARCH_RESCUE" | "PATROL",
    "priority": "IMMEDIATE" | "HIGH" | "STANDARD"
  },
  "reasoning": "<1-2 sentences explaining the response>"
}

Guidelines:
- EMERGENCY severity → notify_emergency=true, deploy_fleet=true, FIRE_RESPONSE
- CRITICAL severity → deploy_fleet=true, RECON mission, consider alarm
- WARNING → toggle alarm if warranted, no fleet deployment
- Always try to reroute power away from offline/degraded nodes to healthy neighbours
- Only deploy fleet when human life or critical infrastructure is at risk"""


class RapidResponseAgent(ZeroClawAgent):
    TIER = 2
    ROLE = "rapid_response"

    async def sense(self) -> SensoryInput:
        await self._set_task("Reading escalated alerts")
        inbox = await self._get_ipc_inbox()
        active_alerts = await self.convex.query("queries/alerts:getActive", {})
        all_nodes = await self.convex.query("queries/nodes:getAll", {})
        return SensoryInput(data={
            "inbox": inbox,
            "active_alerts": active_alerts,
            "nodes": {n["nodeId"]: n for n in all_nodes},
        })

    async def think(self, input: SensoryInput) -> Decision:
        inbox = input.data["inbox"]
        alerts = input.data["active_alerts"]
        nodes = input.data["nodes"]

        if not inbox and not alerts:
            return Decision("no_op", reasoning="No pending escalations")

        # Format context for LLM
        alert_lines = []
        for msg in inbox[:10]:
            p = msg.get("payload", {})
            node = nodes.get(p.get("nodeId", ""), {})
            t = node.get("telemetry", {})
            alert_lines.append(
                f"  [{p.get('severity','?')}] Node {p.get('nodeId','?')} ({p.get('title','?')}) "
                f"— signal={t.get('signalStrength','?')}% cpu={t.get('cpuLoad','?')}%"
            )

        # Add any unacknowledged active alerts not in inbox
        for a in alerts[:5]:
            if not any(m.get("payload", {}).get("alertId") == a.get("_id") for m in inbox):
                alert_lines.append(f"  [{a['severity']}] {a['title']} — {a.get('nodeId','?')}")

        user_msg = (
            f"Escalated incidents ({len(inbox)} IPC messages, {len(alerts)} active alerts):\n"
            + "\n".join(alert_lines) + "\n\n"
            "Decide: alarms, power rerouting, emergency services, fleet deployment."
        )

        raw = await self.ask_deepseek(SYSTEM_PROMPT, user_msg, json_mode=True)
        parsed = json.loads(raw)
        plan = parsed.get("response_plan", {})

        has_action = any([
            plan.get("toggle_alarms"),
            plan.get("reroute_power"),
            plan.get("notify_emergency"),
            plan.get("deploy_fleet"),
        ])
        if not has_action:
            return Decision("no_op", reasoning=parsed.get("reasoning", "No action needed"))

        return Decision(
            action_type="respond",
            payload={"plan": plan, "inbox": inbox},
            reasoning=parsed.get("reasoning", ""),
        )

    async def act(self, decision: Decision) -> None:
        plan = decision.payload.get("plan", {})

        # Toggle alarms
        for node_id in plan.get("toggle_alarms", []):
            await self.convex.mutation("mutations/nodes:toggleAlarm",
                                       {"nodeId": node_id, "active": True})
            log.info(f"[{self.agent_id}] Alarm → {node_id}")

        # Reroute power
        for reroute in plan.get("reroute_power", []):
            await self.convex.mutation("mutations/nodes:setPowerRouting", {
                "nodeId":  reroute["nodeId"],
                "routing": reroute["routing"],
            })
            log.info(f"[{self.agent_id}] Power reroute: {reroute['nodeId']} → {reroute['routing']}")

        # Notify emergency services
        if plan.get("notify_emergency"):
            log.warning(f"[{self.agent_id}] ⚠ EMERGENCY SERVICES NOTIFIED — {decision.reasoning}")
            # TODO: integrate CAD (Computer Aided Dispatch) API endpoint here

    async def communicate(self, decision: Decision) -> None:
        plan = decision.payload.get("plan", {})
        inbox = decision.payload.get("inbox", [])

        # Ack all inbox messages
        for msg in inbox:
            try:
                await self.convex.mutation("mutations/agentMessages:acknowledge",
                                           {"messageId": msg["_id"]})
            except Exception:
                pass

        # Order Fleet Deployment if needed
        if plan.get("deploy_fleet"):
            # Find the most severe node from inbox
            node_id = None
            for msg in inbox:
                p = msg.get("payload", {})
                if p.get("severity") in ("EMERGENCY", "CRITICAL"):
                    node_id = p.get("nodeId")
                    break

            if node_id:
                await self._send_ipc("A-FLEET-01", "order", {
                    "command":     "DEPLOY_MISSION",
                    "nodeId":      node_id,
                    "missionType": plan.get("fleet_mission_type", "RECON"),
                    "priority":    plan.get("priority", "HIGH"),
                })
                log.info(f"[{self.agent_id}] → Fleet deployment ordered for {node_id}")
