"""
ZeroClaw Agent Runtime
Runs all 6 agents concurrently on their respective schedules.

Usage:
  cd agents/
  pip install -r requirements.txt
  cp .env.example .env   # fill in CONVEX_URL and DEEPSEEK_API_KEY
  python main.py
"""
import asyncio
import logging
import os
from dotenv import load_dotenv
from convex_client import ConvexClient
from monitoring import MonitoringAgent
from rapid_response import RapidResponseAgent
from fleet import FleetDeploymentAgent

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Agent schedules (seconds) ─────────────────────────────────────────────────
MONITORING_INTERVAL   = int(os.getenv("MONITORING_INTERVAL",    "30"))
RAPID_RESPONSE_INTERVAL = int(os.getenv("RAPID_RESPONSE_INTERVAL", "15"))
FLEET_INTERVAL        = int(os.getenv("FLEET_INTERVAL",         "20"))


async def main():
    convex = ConvexClient()
    log.info(f"Connected to Convex: {convex.base}")

    # Tier-1: 4 monitoring agents (one per segment)
    monitors = [
        MonitoringAgent("A-MON-DOMESTIC", "DOMESTIC", convex),
        MonitoringAgent("A-MON-OVERSEAS", "OVERSEAS", convex),
        MonitoringAgent("A-MON-MARITIME", "MARITIME", convex),
        MonitoringAgent("A-MON-SPACE",    "SPACE",    convex),
    ]

    # Tier-2 & Tier-3
    rapid    = RapidResponseAgent("A-RAPID-01", convex)
    fleet    = FleetDeploymentAgent("A-FLEET-01", convex)

    # Stagger start times so agents don't all hammer Convex at once
    async def run_with_delay(agent, interval, delay):
        await asyncio.sleep(delay)
        await agent.run_loop(interval)

    tasks = [
        # Monitors staggered 2s apart
        run_with_delay(monitors[0], MONITORING_INTERVAL,     0),
        run_with_delay(monitors[1], MONITORING_INTERVAL,     2),
        run_with_delay(monitors[2], MONITORING_INTERVAL,     4),
        run_with_delay(monitors[3], MONITORING_INTERVAL,     6),
        # Rapid response starts after first monitor cycle
        run_with_delay(rapid,       RAPID_RESPONSE_INTERVAL, 35),
        # Fleet starts after rapid response has had time to queue orders
        run_with_delay(fleet,       FLEET_INTERVAL,          50),
    ]

    log.info("🚀 ZeroClaw agents running. Press Ctrl+C to stop.")
    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        log.info("Shutting down agents...")
    finally:
        await convex.close()


if __name__ == "__main__":
    asyncio.run(main())
