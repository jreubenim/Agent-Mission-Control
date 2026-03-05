"""
Thin async client for Convex HTTP API.
Handles query, mutation, and action calls.
"""
import httpx
import os
from typing import Any

class ConvexClient:
    def __init__(self, url: str | None = None):
        self.base = (url or os.environ["CONVEX_URL"]).rstrip("/")
        self._http = httpx.AsyncClient(timeout=15)

    async def query(self, path: str, args: dict = {}) -> Any:
        r = await self._http.post(
            f"{self.base}/api/query",
            json={"path": path, "args": args},
        )
        r.raise_for_status()
        return r.json()["value"]

    async def mutation(self, path: str, args: dict = {}) -> Any:
        r = await self._http.post(
            f"{self.base}/api/mutation",
            json={"path": path, "args": args},
        )
        r.raise_for_status()
        return r.json()["value"]

    async def action(self, path: str, args: dict = {}) -> Any:
        r = await self._http.post(
            f"{self.base}/api/action",
            json={"path": path, "args": args},
        )
        r.raise_for_status()
        return r.json()["value"]

    async def close(self):
        await self._http.aclose()
