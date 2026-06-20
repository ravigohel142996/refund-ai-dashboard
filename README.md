# RefundAI Dashboard

A production-ready AI Customer Support Agent and Admin Dashboard that evaluates refund requests using a LangGraph deterministic workflow backed by Gemini for natural language summaries.

## Features
- **Customer Portal**: A dynamic chat interface for customers to request refunds.
- **Admin Dashboard**: A real-time (WebSocket) dashboard for tracking AI agent logic, tool executions, and final decisions.
- **Deterministic AI Workflow**: Ensures business logic governs decisions while LLMs are used only for summarizing, preventing hallucinations in financial outcomes.
- **Production Hardened**: Full input validation (Pydantic), error handling, automatic retries (Tenacity), and structured logging.

---

## 🛠 Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher

---

## 🚀 Setup Instructions

### 1. Backend Setup (FastAPI & LangGraph)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment Variables:
   - Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   - Open `.env` and add your **Gemini API Key**:
     ```env
     GEMINI_API_KEY=your_actual_api_key_here
     ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will now be running on `http://localhost:8000`*

### 2. Frontend Setup (React & Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the node modules:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will now be running on `http://localhost:5173`*

---

## 💻 Usage

- **Customer Portal**: Go to `http://localhost:5173/`
  - Try requesting a refund with Customer ID: `CUST-1001` and Order ID: `ORD-9001`
- **Admin Dashboard**: Go to `http://localhost:5173/admin`
  - Leave this tab open. When you make a request in the Customer Portal, you will see real-time execution logs and the final decision appear here instantly via WebSockets!

---

## 🏗 Architecture
- **Backend Framework**: FastAPI
- **Agent Workflow**: LangGraph & LangChain
- **LLM**: Google Gemini (gemini-2.0-flash)
- **Frontend**: React (Vite) + TailwindCSS
- **Real-time**: WebSockets

## 🛡 Production Hardening
- **Validation**: Strict Pydantic models for request payloads.
- **Error Handling**: Global FastAPI exception handlers prevent server crashes.
- **Resilience**: `tenacity` provides exponential backoff retries for LLM calls.
- **Configuration**: `pydantic-settings` manages robust environment variable loading.
