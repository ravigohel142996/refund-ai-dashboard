"""
Tests for the AI Agent Workflow.

These tests call run_agent() directly (no HTTP server) and do NOT require
a Gemini API key — the summary node falls back to structured text.

Validates:
  - Correct refund decisions (business rules only, never Gemini)
  - agent_reasoning_logs structure (step_name, status, timestamp, details)
  - Gemini never influences the decision
"""

import unittest
import os
import sys

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agent_workflow import run_agent


class TestAgentWorkflow(unittest.TestCase):
    """Test the LangGraph agent workflow end-to-end."""

    # ------------------------------------------------------------------
    # Helper: validate reasoning log structure
    # ------------------------------------------------------------------
    def _assert_valid_reasoning_logs(self, logs: list, expected_min: int = 1):
        """Every entry must have step_name, status, timestamp, details."""
        self.assertGreaterEqual(len(logs), expected_min)
        for entry in logs:
            self.assertIn("step_name", entry)
            self.assertIn("status", entry)
            self.assertIn("timestamp", entry)
            self.assertIn("details", entry)
            # timestamp should be ISO format
            self.assertIsInstance(entry["timestamp"], str)
            self.assertGreater(len(entry["timestamp"]), 0)

    # ------------------------------------------------------------------
    # 1. Valid refund — ORD001 / C001  (new, delivered June 18, within window)
    # ------------------------------------------------------------------
    def test_valid_refund(self):
        result = run_agent(
            customer_id="C001",
            order_id="ORD001",
            message="I want a refund for my headphones",
        )
        self.assertEqual(result["decision"], "Approved")
        self.assertEqual(len(result["reasoning"]), 0)

        # tool_logs should cover all steps
        self.assertGreaterEqual(len(result["tool_logs"]), 4)
        self.assertTrue(any("Customer found" in log for log in result["tool_logs"]))
        self.assertTrue(any("Order found" in log for log in result["tool_logs"]))
        self.assertTrue(any("Policy loaded" in log for log in result["tool_logs"]))
        self.assertTrue(any("Approved" in log for log in result["tool_logs"]))

        # agent_reasoning_logs: 5 nodes = 5 entries
        logs = result["agent_reasoning_logs"]
        self._assert_valid_reasoning_logs(logs, expected_min=5)
        step_names = [e["step_name"] for e in logs]
        self.assertIn("customer_lookup", step_names)
        self.assertIn("order_lookup", step_names)
        self.assertIn("policy_lookup", step_names)
        self.assertIn("refund_validation", step_names)
        self.assertIn("generate_summary", step_names)

    # ------------------------------------------------------------------
    # 2. Used product — ORD002 / C002  (used condition)
    # ------------------------------------------------------------------
    def test_used_product_denied(self):
        result = run_agent(
            customer_id="C002",
            order_id="ORD002",
            message="I'd like a refund please",
        )
        self.assertEqual(result["decision"], "Denied")
        self.assertTrue(
            any("Used products" in r or "used" in r.lower() for r in result["reasoning"])
        )
        self._assert_valid_reasoning_logs(result["agent_reasoning_logs"], expected_min=5)

    # ------------------------------------------------------------------
    # 3. Expired refund window — ORD004 / C004  (delivered June 10)
    # ------------------------------------------------------------------
    def test_expired_refund_window(self):
        result = run_agent(
            customer_id="C004",
            order_id="ORD004",
            message="Can I get a refund?",
        )
        self.assertEqual(result["decision"], "Denied")
        self.assertTrue(
            any("expired" in r.lower() or "window" in r.lower() for r in result["reasoning"])
        )
        self._assert_valid_reasoning_logs(result["agent_reasoning_logs"], expected_min=5)

    # ------------------------------------------------------------------
    # 4. Not delivered — ORD005 / C005  (delivered=false)
    # ------------------------------------------------------------------
    def test_not_delivered(self):
        result = run_agent(
            customer_id="C005",
            order_id="ORD005",
            message="Refund my order",
        )
        self.assertEqual(result["decision"], "Denied")
        self.assertTrue(
            any("not been delivered" in r.lower() for r in result["reasoning"])
        )
        self._assert_valid_reasoning_logs(result["agent_reasoning_logs"], expected_min=5)

    # ------------------------------------------------------------------
    # 5. Non-existent customer — short-circuits at node 1
    # ------------------------------------------------------------------
    def test_nonexistent_customer(self):
        result = run_agent(
            customer_id="C999",
            order_id="ORD001",
            message="Refund please",
        )
        self.assertEqual(result["decision"], "Error")
        self.assertTrue(
            any("not found" in r.lower() for r in result["reasoning"])
        )
        # Short-circuit: only 1 tool log, 1 reasoning log
        self.assertEqual(len(result["tool_logs"]), 1)
        logs = result["agent_reasoning_logs"]
        self._assert_valid_reasoning_logs(logs, expected_min=1)
        self.assertEqual(logs[0]["step_name"], "customer_lookup")
        self.assertEqual(logs[0]["status"], "error")

    # ------------------------------------------------------------------
    # 6. Non-existent order — short-circuits at node 2
    # ------------------------------------------------------------------
    def test_nonexistent_order(self):
        result = run_agent(
            customer_id="C001",
            order_id="ORD999",
            message="Refund please",
        )
        self.assertEqual(result["decision"], "Error")
        self.assertTrue(
            any("not found" in r.lower() for r in result["reasoning"])
        )
        # Short-circuit: 2 tool logs, 2 reasoning logs
        self.assertEqual(len(result["tool_logs"]), 2)
        logs = result["agent_reasoning_logs"]
        self._assert_valid_reasoning_logs(logs, expected_min=2)
        self.assertEqual(logs[0]["step_name"], "customer_lookup")
        self.assertEqual(logs[0]["status"], "success")
        self.assertEqual(logs[1]["step_name"], "order_lookup")
        self.assertEqual(logs[1]["status"], "error")

    # ------------------------------------------------------------------
    # 7. Decision independence from Gemini — verify that the decision
    #    and reasoning fields are set BEFORE generate_summary runs,
    #    and that gemini_explanation is a separate field.
    # ------------------------------------------------------------------
    def test_decision_independent_of_gemini(self):
        """The decision must come from validate_refund, not Gemini."""
        result = run_agent(
            customer_id="C001",
            order_id="ORD001",
            message="I want a refund",
        )
        # Decision is set by business rules
        self.assertEqual(result["decision"], "Approved")

        # gemini_explanation is a separate field (None when no API key)
        self.assertIn("gemini_explanation", result)
        self.assertIsNone(result["gemini_explanation"])

        # The refund_validation log should show the decision was made there
        validation_log = next(
            (e for e in result["agent_reasoning_logs"]
             if e["step_name"] == "refund_validation"),
            None,
        )
        self.assertIsNotNone(validation_log)
        self.assertIn("Approved", validation_log["details"])

        # generate_summary should only produce a cosmetic log
        summary_log = next(
            (e for e in result["agent_reasoning_logs"]
             if e["step_name"] == "generate_summary"),
            None,
        )
        self.assertIsNotNone(summary_log)
        self.assertIn(summary_log["status"], ("success", "fallback"))


if __name__ == "__main__":
    unittest.main()
