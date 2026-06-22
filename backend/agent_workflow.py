"""
Agent Workflow — a deterministic LangGraph StateGraph that chains:
  Customer Lookup → Order Lookup → Policy Lookup → Refund Validation → Summary

The refund decision is ALWAYS determined by policy validation tools and
business rules (validate_refund node).  Gemma 4 26B is used ONLY to generate a
natural-language explanation — it never influences the approval/denial.
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Optional

from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from agent_tools import (
    customer_lookup_tool,
    order_lookup_tool,
    policy_lookup_tool,
    refund_validation_tool,
)


# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

class AgentState(TypedDict, total=False):
    # -- inputs --
    customer_id: str
    order_id: str
    message: str
    # -- intermediate --
    customer: Optional[dict]
    order: Optional[dict]
    policy: Optional[str]
    refund_result: Optional[dict]
    # -- outputs --
    decision: str                # "Approved" | "Denied" | "Error"
    reasoning: list              # detailed rejection reasons from the engine
    tool_logs: list              # step-by-step execution logs
    agent_reasoning_logs: list   # structured logs for admin dashboard
    gemini_explanation: Optional[str]  # LLM-generated summary (cosmetic only)
    error: Optional[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_reasoning_log(
    step_name: str,
    status: str,
    details: str,
) -> dict:
    """Create a structured reasoning-log entry for the admin dashboard."""
    return {
        "step_name": step_name,
        "status": status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": details,
    }


# ---------------------------------------------------------------------------
# Node functions
# ---------------------------------------------------------------------------

def lookup_customer(state: AgentState) -> dict[str, Any]:
    """Node 1 — resolve the customer."""
    tool_logs = list(state.get("tool_logs", []))
    reasoning_logs = list(state.get("agent_reasoning_logs", []))

    result = customer_lookup_tool(state["customer_id"])
    tool_logs.append(result["log"])

    if not result["success"]:
        reasoning_logs.append(_make_reasoning_log(
            "customer_lookup", "error", result["log"],
        ))
        return {
            "customer": None,
            "tool_logs": tool_logs,
            "agent_reasoning_logs": reasoning_logs,
            "decision": "Error",
            "reasoning": [result["log"]],
            "error": result["log"],
        }

    reasoning_logs.append(_make_reasoning_log(
        "customer_lookup", "success",
        f"Resolved customer {result['data']['name']} "
        f"(ID: {result['data']['customer_id']}, "
        f"membership: {result['data']['membership_level']})",
    ))
    return {
        "customer": result["data"],
        "tool_logs": tool_logs,
        "agent_reasoning_logs": reasoning_logs,
    }


def lookup_order(state: AgentState) -> dict[str, Any]:
    """Node 2 — resolve the order."""
    tool_logs = list(state.get("tool_logs", []))
    reasoning_logs = list(state.get("agent_reasoning_logs", []))

    result = order_lookup_tool(state["order_id"])
    tool_logs.append(result["log"])

    if not result["success"]:
        reasoning_logs.append(_make_reasoning_log(
            "order_lookup", "error", result["log"],
        ))
        return {
            "order": None,
            "tool_logs": tool_logs,
            "agent_reasoning_logs": reasoning_logs,
            "decision": "Error",
            "reasoning": [result["log"]],
            "error": result["log"],
        }

    reasoning_logs.append(_make_reasoning_log(
        "order_lookup", "success",
        f"Resolved order {result['data']['order_id']} — "
        f"{result['data']['product_name']} "
        f"(${result['data']['order_amount']:.2f}, "
        f"condition: {result['data']['product_condition']}, "
        f"delivered: {result['data']['delivered']})",
    ))
    return {
        "order": result["data"],
        "tool_logs": tool_logs,
        "agent_reasoning_logs": reasoning_logs,
    }


def lookup_policy(state: AgentState) -> dict[str, Any]:
    """Node 3 — load the refund policy."""
    tool_logs = list(state.get("tool_logs", []))
    reasoning_logs = list(state.get("agent_reasoning_logs", []))

    result = policy_lookup_tool()
    tool_logs.append(result["log"])

    reasoning_logs.append(_make_reasoning_log(
        "policy_lookup", "success",
        "Refund policy document loaded for validation.",
    ))
    return {
        "policy": result["data"],
        "tool_logs": tool_logs,
        "agent_reasoning_logs": reasoning_logs,
    }


def validate_refund(state: AgentState) -> dict[str, Any]:
    """
    Node 4 — run the refund validation engine.

    THIS node is the sole authority for the refund decision.
    The decision is based entirely on business rules in refund_engine.py.
    """
    tool_logs = list(state.get("tool_logs", []))
    reasoning_logs = list(state.get("agent_reasoning_logs", []))

    result = refund_validation_tool(
        state["customer"], state["order"], state["policy"]
    )
    tool_logs.append(result["log"])

    refund_data = result["data"]
    decision = "Approved" if refund_data["approved"] else "Denied"

    details = f"Decision: {decision}"
    if refund_data["reasons"]:
        details += f" | Reasons: {'; '.join(refund_data['reasons'])}"
    else:
        details += " | All validation checks passed."

    reasoning_logs.append(_make_reasoning_log(
        "refund_validation", "success", details,
    ))

    return {
        "refund_result": refund_data,
        "decision": decision,
        "reasoning": refund_data["reasons"],
        "tool_logs": tool_logs,
        "agent_reasoning_logs": reasoning_logs,
    }


def generate_summary(state: AgentState) -> dict[str, Any]:
    """
    Node 5 — produce a human-readable summary via Gemma 4 26B.

    IMPORTANT: This node NEVER modifies 'decision' or 'reasoning'.
    It only writes to 'gemini_explanation' (cosmetic) and logs.
    The refund outcome is fully determined by validate_refund above.
    """
    import logging
    from tenacity import retry, stop_after_attempt, wait_exponential
    from config import get_settings

    logger = logging.getLogger(__name__)
    settings = get_settings()

    tool_logs = list(state.get("tool_logs", []))
    reasoning_logs = list(state.get("agent_reasoning_logs", []))

    decision = state.get("decision", "Error")
    reasoning = state.get("reasoning", [])
    customer = state.get("customer")
    order = state.get("order")
    gemini_explanation = None

    api_key = settings.GEMINI_API_KEY

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def call_gemini(prompt: str) -> str:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model="gemma-4-26b-a4b-it",
            google_api_key=api_key,
        )
        response = llm.invoke(prompt)
        raw = response.content
        # Gemma 4 26B (thinking model) may return a list of content parts:
        #   [{"type": "thinking", "thinking": "..."}, "actual answer text"]
        # Extract only the string parts and join them.
        if isinstance(raw, list):
            text_parts = [p for p in raw if isinstance(p, str)]
            return " ".join(text_parts).strip() if text_parts else ""
        return raw

    if api_key and api_key != "YOUR_API_KEY_HERE":
        try:
            prompt = _build_summary_prompt(
                decision, reasoning, customer, order,
                state.get("message", ""),
            )
            logger.info("Calling Gemma 4 26B for summary generation...")
            gemini_explanation = call_gemini(prompt)
            tool_logs.append(
                f"Gemma explanation generated: {gemini_explanation[:120]}..."
            )
            reasoning_logs.append(_make_reasoning_log(
                "generate_summary", "success",
                "Gemma 4 26B natural-language explanation generated.",
            ))
            logger.info("Gemma 4 26B summary successfully generated.")
        except Exception as exc:
            logger.error(f"Gemma call failed after retries: {exc}")
            tool_logs.append(
                f"Gemma summary skipped (error: {exc}). Using fallback."
            )
            reasoning_logs.append(_make_reasoning_log(
                "generate_summary", "fallback",
                f"Gemma 4 26B unavailable ({exc}); structured fallback used.",
            ))
    else:
        logger.warning("No valid GEMINI_API_KEY provided. Using fallback.")
        tool_logs.append("Decision generated (no LLM — structured fallback).")
        reasoning_logs.append(_make_reasoning_log(
            "generate_summary", "fallback",
            "No GEMINI_API_KEY configured; structured fallback used.",
        ))

    return {
        "tool_logs": tool_logs,
        "agent_reasoning_logs": reasoning_logs,
        "gemini_explanation": gemini_explanation,
    }


def _build_summary_prompt(
    decision: str,
    reasoning: list[str],
    customer: dict | None,
    order: dict | None,
    user_message: str,
) -> str:
    customer_name = customer["name"] if customer else "Unknown"
    product_name = order["product_name"] if order else "Unknown"
    reasons_text = "\n".join(f"- {r}" for r in reasoning) if reasoning else "None"

    return (
        f"You are a customer-support AI. Summarise this refund decision in 2–3 sentences.\n\n"
        f"Customer: {customer_name}\n"
        f"Product: {product_name}\n"
        f"User message: {user_message}\n"
        f"Decision: {decision}\n"
        f"Reasons:\n{reasons_text}\n"
    )


# ---------------------------------------------------------------------------
# Routing helpers (conditional edges)
# ---------------------------------------------------------------------------

def _has_error(state: AgentState) -> str:
    """Return 'error' if an error was set, 'continue' otherwise."""
    if state.get("error"):
        return "error"
    return "continue"


# ---------------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------------

def build_agent_graph() -> StateGraph:
    """Construct and compile the LangGraph agent workflow."""
    graph = StateGraph(AgentState)

    # Add nodes
    graph.add_node("lookup_customer", lookup_customer)
    graph.add_node("lookup_order", lookup_order)
    graph.add_node("lookup_policy", lookup_policy)
    graph.add_node("validate_refund", validate_refund)
    graph.add_node("generate_summary", generate_summary)

    # Entry point
    graph.set_entry_point("lookup_customer")

    # Edges with short-circuit on error
    graph.add_conditional_edges(
        "lookup_customer",
        _has_error,
        {"error": END, "continue": "lookup_order"},
    )
    graph.add_conditional_edges(
        "lookup_order",
        _has_error,
        {"error": END, "continue": "lookup_policy"},
    )
    graph.add_edge("lookup_policy", "validate_refund")
    graph.add_edge("validate_refund", "generate_summary")
    graph.add_edge("generate_summary", END)

    return graph.compile()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

_compiled_graph = None


def get_compiled_graph():
    """Return a lazily-compiled singleton of the agent graph."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_agent_graph()
    return _compiled_graph


def run_agent(customer_id: str, order_id: str, message: str) -> dict:
    """
    Execute the full agent workflow.

    Returns:
        {
            "decision": "Approved" | "Denied" | "Error",
            "reasoning": [...],
            "tool_logs": [...],
            "agent_reasoning_logs": [...],
            "gemini_explanation": str | None
        }

    The decision is ALWAYS determined by business-rule validation.
    Gemini only provides a cosmetic natural-language explanation.
    """
    graph = get_compiled_graph()

    initial_state: AgentState = {
        "customer_id": customer_id,
        "order_id": order_id,
        "message": message,
        "customer": None,
        "order": None,
        "policy": None,
        "refund_result": None,
        "decision": "",
        "reasoning": [],
        "tool_logs": [],
        "agent_reasoning_logs": [],
        "gemini_explanation": None,
        "error": None,
    }

    final_state = graph.invoke(initial_state)

    return {
        "decision": final_state.get("decision", "Error"),
        "reasoning": final_state.get("reasoning", []),
        "tool_logs": final_state.get("tool_logs", []),
        "agent_reasoning_logs": final_state.get("agent_reasoning_logs", []),
        "gemini_explanation": final_state.get("gemini_explanation"),
    }
