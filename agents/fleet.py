"""
Tier-3 Fleet Deployment Agent.
sense:       reads deployment orders from Rapid Response + current mission state
think:       asks DeepSeek to plan optimal asset composition for the mission
act:         triggers the Convex fleet deployment action (creates mission + moves drones)
communicate: reports mission status back to Rapid Response
"""
import json
import logging
from base import ZeroClawAgent, SensoryInput, Decision
from convex_client import ConvexClient

log = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the Fleet Deployment AI for the G-TT&C autonomous response system.
You receive deployment orders and decide how to allocate assets (drones, robots, swarms).

Always respond with valid JSON:
{
  "mission_plan": {
    "missionType": "FIRE_RESPONSE" | "RECON" | "SEARCH_RESCUE" | "PATROL" | "EMERGENCY",
    "asset_composition": {
      "drones": <number 0-4>,
      "robots": <number 0-2>,
      "swarms": <number 0-2>
    },
    "estimated_duration_minutes": <number>,
    "approach": "<tactical approach in 1 sentence>"
  },
  "reasoning": "<1-2 sentences>"
}

Asset allocation guidelines:
- FIRE_RESPONSE:    2-3 drones (thermal imaging), 1 robot (ground suppression), 1 swarm (area recon)
- RECON:            1-2 drones (aerial survey), 1 robot (ground verification)
- SEARCH_RESCUE:    2 drones (search pattern), 1 robot (extraction), 1 swarm (wide-area coverage)
- PATROL:           1 drone, 1 robot
- EMERGENCY:        max assets

Consider active mission count — don't over-extend if assets are already deployed."""


class FleetDeploymentAgent(ZeroClawAgent):
    TIER = 3
    ROLE = "fleet_deployment"

    async def sense(self) -> SensoryInput:
        await self._set_task("Reading deployment orders")
        inbox = await self._get_ipc_inbox()
        active_missions = await self.convex.query("queries/missions:getActive", {})
        all_nodes = await self.convex.query("queries/nodes:getAll", {})
        return SensoryInput(data={
            "inbox": inbox,
            "active_missions": active_missions,
            "nodes": {n["nodeId"]: n for n in all_nodes},
        })

    async def think(self, input: SensoryInput) -> Decision:
        inbox = input.data["inbox"]
        missions = input.data["active_missions"]
        nodes = input.data["nodes"]

        # Filter to deployment orders only
        orders = [m for m in inbox if m.get("payload", {}).get("command") == "DEPLOY_MISSION"]
        if not orders:
            return Decision("no_op", reasoning="No deployment orders")

        order = orders[0]  # Process highest-priority order
        p = order.get("payload", {})
        node_id = p.get("nodeId", "")
        mission_type = p.get("missionType", "RECON")
        node = nodes.get(node_id, {})

        user_msg = (
            f"Deployment order received:\n"
            f"  Target node: {node_id} ({node.get('name', 'Unknown')})\n"
            f"  Node status: {node.get('status', 'Unknown')}\n"
            f"  Mission type: {mission_type}\n"
            f"  Priority: {p.get('priority', 'HIGH')}\n"
            f"  Active missions already running: {len(missions)}\n\n"
            "Plan the optimal asset composition for this deployment."
        )

        raw = await self.ask_deepseek(SYSTEM_PROMPT, user_msg, json_mode=True)
        parsed = json.loads(raw)
        plan = parsed.get("mission_plan", {})

        return Decision(
            action_type="deploy",
            payload={
                "order":   order,
                "plan":    plan,
                "node_id": node_id,
            },
            reasoning=parsed.get("reasoning", ""),
        )

    async def act(self, decision: Decision) -> None:
        node_id = decision.payload["node_id"]
        plan = decision.payload["plan"]
        order = decision.payload["order"]
        order_payload = order.get("payload", {})

        log.info(
            f"[{self.agent_id}] Deploying {plan.get('missionType')} to {node_id} "
            f"— {plan.get('approach', '')}"
        )

        # Find the alert associated with this order (if any)
        active_alerts = await self.convex.query("queries/alerts:getActiveByNode",
                                                 {"nodeId": node_id})
        alert_id = active_alerts[0]["_id"] if active_alerts else None

        if not alert_id:
            # Create a placeholder alert so the mission has a valid alertId
            alert_id = await self.convex.mutation("mutations/alerts:create", {
                "nodeId":      node_id,
                "agentId":     self.agent_id,
                "severity":    "WARNING",
                "title":       f"[FLEET] {plan.get('missionType','RECON')} deployment",
                "description": decision.reasoning,
            })

        # Trigger the Convex fleet deployment action (handles drone animation etc.)
        await self.convex.action("actions/triggerMission:simulateMission", {
            "nodeId":      node_id,
            "missionType": plan.get("missionType", order_payload.get("missionType", "RECON")),
        })

        decision.payload["alert_id"] = alert_id

    async def communicate(self, decision: Decision) -> None:
        order = decision.payload.get("order", {})
        node_id = decision.payload.get("node_id", "?")
        plan = decision.payload.get("plan", {})

        # Ack the deployment order
        try:
            await self.convex.mutation("mutations/agentMessages:acknowledge",
                                       {"messageId": order["_id"]})
        except Exception:
            pass

        # Report back to Rapid Response
        await self._send_ipc("A-RAPID-01", "report", {
            "status":      "MISSION_LAUNCHED",
            "nodeId":      node_id,
            "missionType": plan.get("missionType"),
            "approach":    plan.get("approach"),
            "assets":      plan.get("asset_composition"),
        })
        log.info(f"[{self.agent_id}] → Mission report sent to A-RAPID-01")
