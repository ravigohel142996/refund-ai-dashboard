import json
import os
from typing import Optional

# Resolve absolute paths relative to this file's location
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATABASE_DIR = os.path.join(BASE_DIR, "database")

CUSTOMERS_FILE = os.path.join(DATABASE_DIR, "customers.json")
ORDERS_FILE = os.path.join(DATABASE_DIR, "orders.json")
POLICY_FILE = os.path.join(DATABASE_DIR, "refund_policy.txt")


def load_customers() -> list[dict]:
    """Load all customers from the JSON database."""
    with open(CUSTOMERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_orders() -> list[dict]:
    """Load all orders from the JSON database."""
    with open(ORDERS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def load_policy() -> str:
    """Load the refund policy text."""
    with open(POLICY_FILE, "r", encoding="utf-8") as f:
        return f.read()


def get_customer_by_id(customer_id: str) -> Optional[dict]:
    """Return a single customer by their customer_id, or None if not found."""
    customers = load_customers()
    for customer in customers:
        if customer["customer_id"] == customer_id:
            return customer
    return None


def get_order_by_id(order_id: str) -> Optional[dict]:
    """Return a single order by its order_id, or None if not found."""
    orders = load_orders()
    for order in orders:
        if order["order_id"] == order_id:
            return order
    return None
