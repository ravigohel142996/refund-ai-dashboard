# RefundAI: Agentic Customer Support & Admin Dashboard

An enterprise-grade, deterministic AI Customer Support Agent that handles refund requests through a strict LangGraph-powered evaluation engine, ensuring that business logic dictates outcomes while an LLM (Google Gemini) generates human-friendly explanations. 

The project includes a Customer Portal for submitting requests and a real-time Admin Dashboard for monitoring AI agent executions.

---

## 🏗 Architecture & Design

RefundAI implements a **Deterministic AI Agent Workflow** to solve the common issue of LLM hallucinations in financial decisions. 

Instead of asking the LLM to decide if a customer gets a refund, RefundAI uses a LangGraph state machine:
1. **Tool Execution:** The agent fetches Customer Data, Order Data, and the Refund Policy.
2. **Deterministic Evaluation:** A Python rule engine (`refund_engine.py`) strictly evaluates the data against the policy (e.g., Is it within 7 days? Is it used? Is it delivered?).
3. **LLM Generation:** The LLM is invoked *only at the very end* to read the deterministic decision and generate a polite, natural-language explanation for the customer.
4. **Real-time Broadcasting:** Every step of the agent's reasoning is broadcasted to the Admin Dashboard via WebSockets.

---

## 📂 Folder Structure

```text
refund-ai-dashboard/
├── backend/                  # FastAPI Application
│   ├── main.py               # API endpoints & WebSocket manager
│   ├── agent_workflow.py     # LangGraph state machine & LLM integration
│   ├── agent_tools.py        # Tools for the agent to fetch data
│   ├── refund_engine.py      # Deterministic rule engine for refunds
│   ├── config.py             # Pydantic settings management
│   ├── data_utils.py         # JSON database loaders
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React + Vite Application
│   ├── src/
│   │   ├── CustomerPortal.jsx # Customer chat interface
│   │   ├── AdminDashboard.jsx # Real-time admin monitoring
│   │   ├── ChatMessage.jsx   # UI component for messages
│   │   ├── api.js            # Axios API calls to backend
│   │   └── index.css         # TailwindCSS configuration
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
└── database/                 # Mock JSON Database
    ├── customers.json
    ├── orders.json
    └── refund_policy.txt
```

---

## 🚀 Installation & Setup Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment Variables:
   - Copy `.env.example` to `.env`
   - Add your Gemini API key: `GEMINI_API_KEY=your_api_key_here`
5. Start the server:
   ```bash
   uvicorn main:app --reload
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite server:
   ```bash
   npm run dev
   ```
   Access the Customer Portal at `http://localhost:5173/` and the Admin Dashboard at `http://localhost:5173/admin`.

---

## 📖 API Documentation

The backend provides a fully documented Swagger UI. Once the backend is running, visit `http://localhost:8000/docs`.

### Core Endpoints
- `GET /health` - Returns server health and environment status.
- `GET /orders/{order_id}` - Fetch details of a specific order.
- `POST /refund-check` - Deterministic evaluation of an order (bypasses LLM).
- `POST /agent-chat` - Executes the full LangGraph workflow and returns the LLM summary alongside the deterministic decision.
- `WS /ws/admin` - WebSocket connection for real-time agent execution logs.

---

## 🧪 Demo Scenarios

To test the application, open the Customer Portal and the Admin Dashboard side-by-side. Use the following combinations:

### Scenario 1: Standard Refund Approval
- **Customer ID:** `C001`
- **Order ID:** `ORD001`
- **Message:** "I want to return my headphones, they are new."
- **Expected Outcome:** Approved. The order was delivered recently and is in 'new' condition.

### Scenario 2: Policy Violation (Denied)
- **Customer ID:** `C002`
- **Order ID:** `ORD002`
- **Message:** "I used this iPad for a few days but I don't want it anymore."
- **Expected Outcome:** Denied. The refund engine detects the condition is 'used', which violates the refund policy.

### Scenario 3: Edge Case (Not Delivered Yet)
- **Customer ID:** `C005`
- **Order ID:** `ORD005`
- **Message:** "Cancel my Instant Pot order."
- **Expected Outcome:** Denied/Error handling. The product has not been delivered yet, so a standard return cannot be processed.
