from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from dotenv import load_dotenv
from pydantic import BaseModel
import json
import asyncio
from typing import List

from refund_engine import evaluate_refund
from agent_workflow import run_agent
from data_utils import (
    load_customers,
    load_orders,
    load_policy,
    get_customer_by_id,
    get_order_by_id,
)

load_dotenv()

app = FastAPI(title="AI Customer Support Agent API")

# Configure CORS
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# WebSockets Connection Manager
# -------------------------------------------------------------------

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()


@app.websocket("/ws/admin")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time admin dashboard updates."""
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from the client, just keep connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# -------------------------------------------------------------------
# Health endpoints
# -------------------------------------------------------------------

@app.get("/")
def read_root():
    return {"message": "AI Customer Support Agent Backend is running."}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# -------------------------------------------------------------------
# Data endpoints
# -------------------------------------------------------------------

@app.get("/customers")
def get_all_customers():
    """Return a list of all customers."""
    return load_customers()


@app.get("/customers/{customer_id}")
def get_customer(customer_id: str):
    """Return a single customer by ID."""
    customer = get_customer_by_id(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found.")
    return customer


@app.get("/orders")
def get_all_orders():
    """Return a list of all orders."""
    return load_orders()


@app.get("/orders/{order_id}")
def get_order(order_id: str):
    """Return a single order by ID."""
    order = get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")
    return order


@app.get("/policy")
def get_policy():
    """Return the refund policy as plain text."""
    policy_text = load_policy()
    return {"policy": policy_text}


# -------------------------------------------------------------------
# Logic endpoints
# -------------------------------------------------------------------

class RefundCheckRequest(BaseModel):
    order_id: str

@app.post("/refund-check")
def check_refund(req: RefundCheckRequest):
    """Evaluate whether an order is eligible for a refund."""
    order = get_order_by_id(req.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    customer = get_customer_by_id(order["customer_id"])
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    policy = load_policy()
    
    result = evaluate_refund(customer, order, policy)
    return result


# -------------------------------------------------------------------
# Agent endpoints
# -------------------------------------------------------------------

class AgentChatRequest(BaseModel):
    customer_id: str
    order_id: str
    message: str = "I want a refund"


@app.post("/agent-chat")
async def agent_chat(req: AgentChatRequest):
    """
    Run the full AI agent workflow.

    Accepts a customer_id, order_id, and user message.
    Returns the agent's decision, reasoning, and tool execution logs.
    Also broadcasts the result to connected admin websockets.
    """
    result = await run_in_threadpool(
        run_agent,
        customer_id=req.customer_id,
        order_id=req.order_id,
        message=req.message,
    )
    
    # Broadcast to admin dashboard
    broadcast_data = {
        "customer_id": req.customer_id,
        "order_id": req.order_id,
        "decision": result.get("decision"),
        "agent_reasoning_logs": result.get("agent_reasoning_logs", [])
    }
    await manager.broadcast(json.dumps(broadcast_data))
    
    return result
