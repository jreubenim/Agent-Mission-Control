"""
Base ZeroClaw-style agent.
Every agent implements: sense → think → act → communicate
"""
import os
import asyncio
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any
from openai import AsyncOpenAI
from convex_client import ConvexClient

log = logging.getLogger(__name__)

@dataclass
class SensoryInput:
    """Raw data gathered from the environment."""
    data: dict[str, Any] = field(default_factory=dict)

@dataclass
class Decision:
    """What the agent decided to do after reasoning."""
    action_type: str          # e.g. "raise_alert", "deploy_fleet", "no_op"
    payload: dict[str, Any] = field(default_factory=dict)
    reasoning: str = ""


class ZeroClawAgent(ABC):
    """
    Base agent following the ZeroClaw sense→think→act→communicate loop.
    Each subclass implements the 4 methods for its specific role.
    """
    TIER: int = 0
    ROLE: str = "base"

    def __init__(self, agent_id: str, convex: ConvexClient):
        self.agent_id = agent_id
        self.convex = convex
        self.llm = AsyncOpenAI(
            api_key=os.environ["DEEPSEEK_API_KEY"],
            base_url="https://api.deepseek.com/v1",
        )

    # ── The 4 ZeroClaw methods ────────────────────────────────────────────────

    @abstractmethod
    async def sense(self) -> SensoryInput:
        """Gather data from Convex (nodes, alerts, IPC messages, sensors)."""

    @abstractmethod
    async def think(self, input: SensoryInput) -> Decision:
        """Send sensory data to DeepSeek and get a structured decision back."""

    @abstractmethod
    async def act(self, decision: Decision) -> None:
        """Execute the decision by writing mutations to Convex."""

    @abstractmethod
    async def communicate(self, decision: Decision) -> None:
        """Send IPC messages to other agents in the hierarchy."""

    # ── Lifecycle ─────────────────────────────────────────────────────────────

    async def run_once(self) -> None:
        """One full sense→think→act→communicate cycle."""
        await self._set_status("ACTIVE")
        try:
            sensory = await self.sense()
            decision = await self.think(sensory)
            if decision.action_type != "no_op":
                await self.act(decision)
                await self.communicate(decision)
            log.info(f"[{self.agent_id}] {decision.action_type} — {decision.reasoning[:80]}")
        except Exception as e:
            log.error(f"[{self.agent_id}] Error in cycle: {e}")
        finally:
            await self._set_status("IDLE")

    async def run_loop(self, interval_seconds: int) -> None:
        """Run the agent loop indefinitely on a fixed interval."""
        log.info(f"[{self.agent_id}] Starting (interval={interval_seconds}s)")
        while True:
            await self.run_once()
            await asyncio.sleep(interval_seconds)

    # ── Helpers ───────────────────────────────────────────────────────────────

    async def _set_status(self, status: str):
        await self.convex.mutation("mutations/agents:updateStatus",
                                   {"agentId": self.agent_id, "status": status})

    async def _set_task(self, task: str | None):
        await self.convex.mutation("mutations/agents:updateTask",
                                   {"agentId": self.agent_id,
                                    "currentTask": task,
                                    "lastRunAt": int(__import__("time").time() * 1000)})

    async def _send_ipc(self, recipient_id: str, msg_type: str, payload: dict):
        await self.convex.mutation("mutations/agentMessages:send", {
            "senderId": self.agent_id,
            "recipientId": recipient_id,
            "type": msg_type,
            "payload": payload,
        })

    async def _get_ipc_inbox(self) -> list[dict]:
        return await self.convex.query("queries/agentMessages:getForAgent",
                                       {"agentId": self.agent_id})

    async def ask_deepseek(self, system: str, user: str, json_mode: bool = True) -> str:
        """Call DeepSeek with a system + user prompt. Returns the text response."""
        resp = await self.llm.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
            temperature=0.2,
            max_tokens=512,
            response_format={"type": "json_object"} if json_mode else {"type": "text"},
        )
        return resp.choices[0].message.content or ""
