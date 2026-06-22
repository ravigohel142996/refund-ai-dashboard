from datetime import datetime

def validate_delivery(order: dict) -> tuple[bool, str]:
    """Check if the order has been delivered."""
    if not order.get("delivered", False):
        return False, "Product has not been delivered yet."
    return True, ""

def validate_refund_window(order: dict, current_date_str: str = "2026-06-20") -> tuple[bool, str]:
    """Check if the refund request is within 7 days of delivery."""
    delivery_date_str = order.get("delivery_date")
    if not delivery_date_str:
        return False, "No delivery date available."
    
    delivery_date = datetime.strptime(delivery_date_str, "%Y-%m-%d")
    current_date = datetime.strptime(current_date_str, "%Y-%m-%d")
    
    days_since_delivery = (current_date - delivery_date).days
    
    if days_since_delivery > 7:
        return False, f"Refund window expired. Order was delivered {days_since_delivery} days ago (limit is 7 days)."
    elif days_since_delivery < 0:
        return False, "Invalid delivery date (in the future)."
        
    return True, ""

def validate_product_condition(order: dict) -> tuple[bool, str]:
    """Check if the product condition is eligible for a refund."""
    condition = order.get("product_condition", "").lower()
    
    if condition == "used":
        return False, "Used products are not eligible for a refund."
    
    # "new" and "damaged" are eligible
    return True, ""

def evaluate_refund(customer: dict, order: dict, policy: str, current_date_str: str = "2026-06-20") -> dict:
    """
    Decision engine to evaluate if an order is eligible for a refund.
    Returns:
    {
      "approved": true/false,
      "reasons": [...]
    }
    """
    reasons = []
    
    # 1. Delivery Validation
    is_delivered, del_reason = validate_delivery(order)
    if not is_delivered:
        reasons.append(del_reason)
    else:
        # 2. Window Validation (only check if delivered)
        in_window, win_reason = validate_refund_window(order, current_date_str)
        if not in_window:
            # We can implement Platinum exception here if needed, 
            # but standard rules say denied if > 7 days.
            if customer.get("membership_level") == "platinum":
                # Example: Platinum members get a pass on the window
                # For now, strict 7-day rule for simplicity.
                pass
            reasons.append(win_reason)

    # 3. Product Condition Validation
    valid_condition, cond_reason = validate_product_condition(order)
    if not valid_condition:
        reasons.append(cond_reason)
        
    approved = len(reasons) == 0
    
    return {
        "approved": approved,
        "reasons": reasons
    }
