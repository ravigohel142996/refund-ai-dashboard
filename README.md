# RefundAI — AI Customer Support Agent

> **Live Demo:** https://refund-ai-dashboard-1.onrender.com  
> **GitHub Repo:** https://github.com/ravigohel142996/refund-ai-dashboard

An enterprise-grade, deterministic AI Customer Support Agent that evaluates e-commerce refund requests through a strict policy engine — using **LangGraph** for the agent loop, **Google Gemini (Gemma 4 26B)** for natural-language explanations, and a real-time Admin Dashboard with WebSocket broadcasting.

---

## ✨ Key Features

| Feature | Detail |
|---|---|
| 🤖 **LangGraph Agent** | 4-node state graph: Customer Lookup → Order Lookup → Policy Lookup → Refund Validation → Summary |
| 🔒 **Deterministic Decisions** | Refund approval is 100% rule-based (never hallucinated by LLM) |
| 💬 **Customer Chat UI** | Mobile-responsive chat portal with quick-reply chips |
| 🎤 **Voice Input (STT)** | Microphone button using Web Speech Recognition — speak your refund request |
| 🔊 **Voice Output (TTS)** | AI responses read aloud via Web Speech Synthesis with animated waveform |
| 📊 **Real-time Admin Dashboard** | Live WebSocket feed, execution trace, approval stats |
| 🔐 **Admin Authentication** | Login-protected admin panel (session-based) |
| 📱 **Fully Mobile Responsive** | Works on phone, tablet and desktop |
| 🗃️ **Mock CRM Database** | 15 customer profiles + 32 orders across varied conditions |

---

## 🏗 Architecture

RefundAI implements a **Deterministic AI Agent Workflow** to solve LLM hallucinations in financial decisions.

```
Customer Request
       │
       ▼
┌──────────────────────────────────────────────────┐
│              LangGraph State Machine              │
│                                                   │
│  1. lookup_customer  →  Validate customer exists  │
│  2. lookup_order     →  Validate order exists     │
│  3. lookup_policy    →  Load refund policy doc    │
│  4. validate_refund  →  Rule engine decision ✅/❌ │
│  5. generate_summary →  Gemma 4 26B explanation  │
└──────────────────────────────────────────────────┘
       │
       ▼
Result broadcast via WebSocket → Admin Dashboard
```

**Refund Rules Engine** (`refund_engine.py`):
- ✅ Product must be **delivered**
- ✅ Request must be within **7 days** of delivery
- ✅ Product condition must not be **"used"**

---

## 📂 Folder Structure

```
refund-ai-dashboard/
├── backend/
│   ├── main.py               # FastAPI + WebSocket manager (history-aware)
│   ├── agent_workflow.py     # LangGraph state machine + Gemma 4 26B
│   ├── agent_tools.py        # Customer/order/policy lookup tools
│   ├── refund_engine.py      # Deterministic refund rule engine
│   ├── config.py             # Pydantic settings
│   ├── data_utils.py         # JSON database loaders
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.jsx            # Routing with protected admin route
│       ├── CustomerPortal.jsx # Mobile-first customer chat UI
│       ├── AdminDashboard.jsx # Real-time admin monitoring + logout
│       ├── AdminLogin.jsx     # Auth login page
│       ├── ChatMessage.jsx    # Chat bubble component
│       ├── ChatInput.jsx      # Input with quick-reply chips
│       ├── TypingIndicator.jsx
│       └── index.css          # Design system (white minimal)
└── database/
    ├── customers.json         # 15 CRM customer profiles
    ├── orders.json            # 32 orders (varied conditions)
    └── refund_policy.txt      # Strict refund policy document
```

---

## 🚀 Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env → add your GEMINI_API_KEY
uvicorn main:app --reload
```

Backend runs at: `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- **Customer Portal:** `http://localhost:5173/`
- **Admin Login:** `http://localhost:5173/admin/login`
- **Admin Dashboard:** `http://localhost:5173/admin` *(requires login)*

### Admin Credentials
| Field | Value |
|---|---|
| Email | `admin222@gmail.com` |
| Password | `12345678` |

---

## 📖 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/customers` | List all 15 CRM customers |
| `GET` | `/orders/{order_id}` | Fetch order details |
| `POST` | `/refund-check` | Rule-engine only (no LLM) |
| `POST` | `/agent-chat` | Full LangGraph agent + Gemini summary |
| `WS` | `/ws/admin` | Real-time admin WebSocket (history-aware) |

---

## 🧪 Demo Scenarios

Open the Customer Portal and Admin Dashboard side-by-side for a live demo.

### ✅ Scenario 1: Standard Approval
| Field | Value |
|---|---|
| Customer ID | `C001` |
| Order ID | `ORD001` |
| Message | `"I want to return my headphones, they are in new condition."` |
| Expected | **Approved** — delivered recently, new condition |

### ❌ Scenario 2: Policy Violation (Used Item)
| Field | Value |
|---|---|
| Customer ID | `C002` |
| Order ID | `ORD002` |
| Message | `"I used this iPad for a few days but want a refund."` |
| Expected | **Denied** — used condition violates policy |

### ❌ Scenario 3: Expired Refund Window
| Field | Value |
|---|---|
| Customer ID | `C014` |
| Order ID | `ORD014` |
| Message | `"I want a refund for my power bank."` |
| Expected | **Denied** — delivered more than 7 days ago |

### ❌ Scenario 4: Not Yet Delivered
| Field | Value |
|---|---|
| Customer ID | `C005` |
| Order ID | `ORD005` |
| Message | `"Cancel my Instant Pot order."` |
| Expected | **Denied** — product not yet delivered |

### ✅ Scenario 5: Damaged Item (Eligible)
| Field | Value |
|---|---|
| Customer ID | `C003` |
| Order ID | `ORD003` |
| Message | `"My TV arrived damaged, I need a refund."` |
| Expected | **Approved** — damaged condition is eligible |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Agent Framework** | LangGraph (StateGraph) |
| **LLM** | Google Gemma 4 26B via `langchain-google-genai` |
| **Backend** | FastAPI + WebSockets + Uvicorn |
| **Frontend** | React 18 + Vite + TailwindCSS |
| **Database** | JSON flat files (CRM mock) |
| **Deployment** | Render.com (backend + frontend) |

---

## 🔍 Admin Dashboard

The Admin Dashboard (`/admin`) requires authentication:

- **Real-time WebSocket** feed of all refund decisions
- **History replay** — new connections receive all past decisions
- **Execution trace** — expand any card to see step-by-step tool calls
- **Search & Filter** — by customer ID, order ID, or decision status
- **Live stats** — total, approved, denied, approval rate

---

*Built for the WORPODD AI Customer Support Agent Challenge.*
