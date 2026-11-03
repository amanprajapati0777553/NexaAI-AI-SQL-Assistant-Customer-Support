# NexaAI — AI SQL Assistant + AI Customer Support

Full-stack learning MVP using React/Vite, Express/MongoDB, FastAPI, OpenAI, and read-only SQLite.

## Prerequisites
Node.js 20+, Python 3.11+, MongoDB local/Atlas, OpenAI API key.

## Windows PowerShell setup

### Express/MongoDB API
```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```
Configure `MONGODB_URI` and a strong `JWT_SECRET` in `server/.env`.

### FastAPI AI service (new terminal)
```powershell
cd ai-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```
Configure `OPENAI_API_KEY` in `ai-service/.env`.

### React (new terminal)
```powershell
cd client
npm install
Copy-Item .env.example .env
npm run dev
```
Open http://localhost:5173, register, then choose SQL Assistant or Customer Support.

## Sample SQL prompts
- Show the top 5 students by marks
- Find students scoring above 80
- List shipped orders
- Calculate average marks

The FastAPI service creates `ai-service/demo.db` with sample students and orders.

## API
Express: GET `/health`, POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/auth/me` (Bearer token).
FastAPI: GET `/health`, POST `/sql/ask`, POST `/support/chat`.

## Deployment
Deploy client to Vercel (root `client`), Express and FastAPI separately to Render (roots `server` and `ai-service`), and use MongoDB Atlas. Set `VITE_API_URL`, `VITE_AI_URL`, `CLIENT_ORIGIN`, `MONGODB_URI`, `JWT_SECRET`, and `OPENAI_API_KEY` in the respective services.

## Security
This is an educational MVP. SQL checks are not a full sandbox; SQL runs only against isolated demo SQLite in read-only mode. Do not connect production databases or let users submit connection strings. For production, implement JWT authorization for AI endpoints, table allowlists, robust SQL parsing, least-privilege database credentials, execution timeouts, rate limiting, audit logs, upload validation, tenant separation, and secure cookie-based auth. Never put OpenAI secrets in the frontend. FAQ support does not query real customer accounts/orders.
# NexaAI-AI-SQL-Assistant-Customer-Support
