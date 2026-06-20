import unittest
from backend.refund_engine import evaluate_refund

class TestRefundEngine(unittest.TestCase):
    def setUp(self):
        self.policy = "Standard refund policy."
        self.customer = {
            "id": "C1",
            "name": "Test User",
            "membership_level": "standard"
        }

    def test_valid_refund(self):
        order = {
            "id": "O1",
            "customer_id": "C1",
            "delivered": True,
            "delivery_date": "2026-06-15",
            "product_condition": "new"
        }
        result = evaluate_refund(self.customer, order, self.policy, current_date_str="2026-06-20")
        self.assertTrue(result["approved"])
        self.assertEqual(len(result["reasons"]), 0)

    def test_used_product(self):
        order = {
            "id": "O2",
            "customer_id": "C1",
            "delivered": True,
            "delivery_date": "2026-06-15",
            "product_condition": "used"
        }
        result = evaluate_refund(self.customer, order, self.policy, current_date_str="2026-06-20")
        self.assertFalse(result["approved"])
        self.assertIn("Used products are not eligible for a refund.", result["reasons"])

    def test_expired_refund_window(self):
        order = {
            "id": "O3",
            "customer_id": "C1",
            "delivered": True,
            "delivery_date": "2026-06-10",
            "product_condition": "new"
        }
        result = evaluate_refund(self.customer, order, self.policy, current_date_str="2026-06-20")
        self.assertFalse(result["approved"])
        self.assertTrue(any("Refund window expired" in reason for reason in result["reasons"]))

if __name__ == "__main__":
    unittest.main()
