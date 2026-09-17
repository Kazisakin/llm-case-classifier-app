"""
MCP server for the LLM Case Classifier API.

This exposes the existing FastAPI "internal API" (main.py) as a set of MCP
tools, so any MCP-aware agent (Claude Desktop, Claude Code, etc.) can submit,
triage, and manage support cases directly through natural-language requests
instead of a human clicking through the Fieldbook-style dashboard.

This mirrors a common real-world pattern: a thin MCP layer in front of an
existing internal REST/GraphQL API, translating tool calls into HTTP requests
against a service that already has its own auth, validation and business
logic.

Run locally:
    pip install -r requirements-mcp.txt
    export CASE_CLASSIFIER_API_URL=http://localhost:8000   # or the Render URL
    python mcp_server.py

Then point an MCP client at it. For Claude Desktop / Claude Code, add to your
MCP config (see README section below), e.g.:

    {
      "mcpServers": {
        "case-classifier": {
          "command": "python",
          "args": ["/absolute/path/to/backend/mcp_server.py"],
          "env": { "CASE_CLASSIFIER_API_URL": "http://localhost:8000" }
        }
      }
    }
"""
import os
from typing import Optional

import httpx
from mcp.server.mcpserver import MCPServer

API_BASE_URL = os.getenv("CASE_CLASSIFIER_API_URL", "http://localhost:8000")

mcp = MCPServer(
    "case-classifier",
    instructions=(
        "Tools for submitting and managing support cases in the LLM Case "
        "Classifier system. Use classify_case to file a new case (it will "
        "be auto-categorized by Claude), list_cases / get_case_stats to "
        "review the queue, and resolve_case / escalate_case / "
        "request_verification to act on an existing case."
    ),
)


async def _client() -> httpx.AsyncClient:
    return httpx.AsyncClient(base_url=API_BASE_URL, timeout=30.0)


@mcp.tool()
async def classify_case(description: str, email: str, priority: str = "Medium") -> dict:
    """Submit a new support case and have Claude classify it.

    Args:
        description: Free-text description of the customer's issue.
        email: The customer's email address.
        priority: One of "Low", "Medium", or "High".
    """
    async with await _client() as client:
        resp = await client.post(
            "/classify-case",
            json={"description": description, "email": email, "priority": priority},
        )
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def list_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
) -> list:
    """List support cases, optionally filtered by status/priority/category.

    Args:
        status: Filter by status, e.g. "Pending", "Resolved", "Escalated".
        priority: Filter by priority, e.g. "Low", "Medium", "High".
        category: Filter by category, e.g. "Fraud", "Account Access".
    """
    params = {k: v for k, v in {"status": status, "priority": priority, "category": category}.items() if v}
    async with await _client() as client:
        resp = await client.get("/cases/filter", params=params)
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def get_case_stats() -> dict:
    """Get aggregate case statistics: totals, breakdown by category/priority, daily volume."""
    async with await _client() as client:
        resp = await client.get("/cases/stats")
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def resolve_case(case_id: int) -> dict:
    """Mark a case as resolved.

    Args:
        case_id: The numeric ID of the case to resolve.
    """
    async with await _client() as client:
        resp = await client.patch(f"/cases/{case_id}/resolve")
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def escalate_case(case_id: int) -> dict:
    """Escalate a case to the next level (max level 2).

    Args:
        case_id: The numeric ID of the case to escalate.
    """
    async with await _client() as client:
        resp = await client.patch(f"/cases/{case_id}/escalate")
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def request_verification(case_id: int) -> dict:
    """Request identity verification for a case.

    Args:
        case_id: The numeric ID of the case that needs verification.
    """
    async with await _client() as client:
        resp = await client.post(f"/cases/{case_id}/verify")
        resp.raise_for_status()
        return resp.json()


if __name__ == "__main__":
    mcp.run(transport="stdio")
