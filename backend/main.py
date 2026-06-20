import logging
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
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
from config import get_settings

settings = get_settings()

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Customer Support Agent API",
    description="API for evaluating refund requests using an AI Agent.",
    version="1.0.0"
)

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

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error": str(exc)},
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
        logger.info(f"WebSocket connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Failed to send websocket message: {e}")

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

@app.get("/", tags=["Health"])
def read_root():
    return {"message": "AI Customer Support Agent Backend is running."}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}


# -------------------------------------------------------------------
# Data endpoints
# -------------------------------------------------------------------

@app.get("/customers", tags=["Data"])
def get_all_customers():
    """Return a list of all customers."""
    logger.info("Fetching all customers")
    return load_customers()


@app.get("/customers/{customer_id}", tags=["Data"])
def get_customer(customer_id: str):
    """Return a single customer by ID."""
    customer = get_customer_by_id(customer_id)
    if not customer:
        logger.warning(f"Customer '{customer_id}' not found.")
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found.")
    return customer


@app.get("/orders", tags=["Data"])
def get_all_orders():
    """Return a list of all orders."""
    logger.info("Fetching all orders")
    return load_orders()


@app.get("/orders/{order_id}", tags=["Data"])
def get_order(order_id: str):
    """Return a single order by ID."""
    order = get_order_by_id(order_id)
    if not order:
        logger.warning(f"Order '{order_id}' not found.")
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")
    return order


@app.get("/policy", tags=["Data"])
def get_policy():
    """Return the refund policy as plain text."""
    policy_text = load_policy()
    return {"policy": policy_text}


# -------------------------------------------------------------------
# Logic endpoints
# -------------------------------------------------------------------

class RefundCheckRequest(BaseModel):
    order_id: str = Field(..., min_length=1, description="The ID of the order to check")

@app.post("/refund-check", tags=["Logic"])
def check_refund(req: RefundCheckRequest):
    """Evaluate whether an order is eligible for a refund."""
    logger.info(f"Checking refund for order_id={req.order_id}")
    order = get_order_by_id(req.order_id)
    if not order:
        logger.warning(f"Refund check failed: Order '{req.order_id}' not found.")
        raise HTTPException(status_code=404, detail="Order not found")
        
    customer = get_customer_by_id(order["customer_id"])
    if not customer:
        logger.warning(f"Refund check failed: Customer '{order['customer_id']}' not found.")
        raise HTTPException(status_code=404, detail="Customer not found")
        
    policy = load_policy()
    
    result = evaluate_refund(customer, order, policy)
    logger.info(f"Refund result for order_id={req.order_id}: {result['approved']}")
    return result


# -------------------------------------------------------------------
# Agent endpoints
# -------------------------------------------------------------------

class AgentChatRequest(BaseModel):
    customer_id: str = Field(..., min_length=1, description="The ID of the customer")
    order_id: str = Field(..., min_length=1, description="The ID of the order to check")
    message: str = Field("I want a refund", min_length=1, description="The message from the customer")


@app.post("/agent-chat", tags=["Agent"])
async def agent_chat(req: AgentChatRequest):
    """
    Run the full AI agent workflow.

    Accepts a customer_id, order_id, and user message.
    Returns the agent's decision, reasoning, and tool execution logs.
    Also broadcasts the result to connected admin websockets.
    """
    logger.info(f"Starting agent chat for customer_id={req.customer_id}, order_id={req.order_id}")
    
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
    
    logger.info(f"Agent chat finished for order_id={req.order_id}. Decision: {result.get('decision')}")
    return result
