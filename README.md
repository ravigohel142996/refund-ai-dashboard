# AI Customer Support Agent

This is the project structure for an AI Customer Support Agent.

## Tech Stack
- Frontend: React + Vite + TailwindCSS
- Backend: FastAPI
- AI: Gemini API
- Agent Framework: LangGraph (to be added)
- Database: JSON files

## Setup

### Backend
1. From the project root, create a virtual environment: `python -m venv venv`
2. Activate: `.\venv\Scripts\activate` (Windows)
3. Install requirements: `pip install -r backend\requirements.txt`
4. **Run server from the `backend/` directory:**
   ```
   cd backend
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

## API Endpoints

| Method | Endpoint                  | Description                     |
|--------|---------------------------|---------------------------------|
| GET    | `/`                       | Root — confirms backend is live |
| GET    | `/health`                 | Health check                    |
| GET    | `/customers`              | List all 15 customers           |
| GET    | `/customers/{id}`         | Get a single customer by ID     |
| GET    | `/orders`                 | List all 32 orders              |
| GET    | `/orders/{id}`            | Get a single order by ID        |
| GET    | `/policy`                 | Get the refund policy text      |

## Database (JSON files)

| File                        | Contents                              |
|-----------------------------|---------------------------------------|
| `database/customers.json`   | 15 mock customers with membership     |
| `database/orders.json`      | 32 mock orders with various statuses  |
| `database/refund_policy.txt`| Plain-text refund rules               |

### Frontend
1. cd `frontend`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
