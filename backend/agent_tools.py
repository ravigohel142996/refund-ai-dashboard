"""
Agent Tools — thin wrappers around data_utils and refund_engine
that record structured logs for the agent workflow.
"""

from data_utils import get_customer_by_id, get_order_by_id, load_policy
from refund_engine import evaluate_refund


def customer_lookup_tool(customer_id: str) -> dict:
    """
    Look up a customer by ID.
    Returns {"success": bool, "data": ..., "log": str}
    """
    customer = get_customer_by_id(customer_id)
    if customer is None:
        return {
            "success": False,
            "data": None,
            "log": f"Customer '{customer_id}' not found in database.",
        }
    return {
        "success": True,
        "data": customer,
        "log": f"Customer found: {customer['name']} (membership: {customer['membership_level']})",
    }


def order_lookup_tool(order_id: str) -> dict:
    """
    Look up an order by ID.
    Returns {"success": bool, "data": ..., "log": str}
    """
    order = get_order_by_id(order_id)
    if order is None:
        return {
            "success": False,
            "data": None,
            "log": f"Order '{order_id}' not found in database.",
        }
    return {
        "success": True,
        "data": order,
        "log": (
            f"Order found: {order['product_name']} "
            f"(${order['order_amount']:.2f}, "
            f"condition: {order['product_condition']}, "
            f"delivered: {order['delivered']})"
        ),
    }


def policy_lookup_tool() -> dict:
    """
    Load the refund policy text.
    Returns {"success": bool, "data": str, "log": str}
    """
    policy = load_policy()
    return {
        "success": True,
        "data": policy,
        "log": "Policy loaded successfully.",
    }


def refund_validation_tool(customer: dict, order: dict, policy: str) -> dict:
    """
    Run the refund validation engine.
    Returns {"success": bool, "data": {"approved": bool, "reasons": [...]}, "log": str}
    """
    result = evaluate_refund(customer, order, policy)
    status = "Approved" if result["approved"] else "Denied"
    log_msg = f"Refund validation complete — decision: {status}"
    if result["reasons"]:
        log_msg += f" | Reasons: {'; '.join(result['reasons'])}"
    return {
        "success": True,
        "data": result,
        "log": log_msg,
    }
