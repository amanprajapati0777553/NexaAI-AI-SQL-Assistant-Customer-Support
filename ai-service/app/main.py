import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.database import initialize_database
from app.sql_assistant import ask_database
from app.customer_support import answer_customer

load_dotenv()
app = FastAPI(title="NexaAI AI Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CLIENT_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)
initialize_database()

class SQLRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)

class SupportRequest(BaseModel):
    question: str = Field(min_length=2, max_length=2000)
    history: list[dict[str, str]] = Field(default_factory=list, max_length=12)

@app.get("/health")
def health():
    return {"status": "ok", "service": "NexaAI AI Service"}

@app.post("/sql/ask")
def sql_ask(body: SQLRequest):
    try:
        return ask_database(body.question)

    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    except Exception as exc:
        logging.exception("SQL generation or execution failed")
        raise HTTPException(
            status_code=502,
            detail=f"SQL generation or execution failed: {str(exc)}"
        )

@app.post("/support/chat")
def support_chat(body: SupportRequest):
    try:
        answer = answer_customer(body.question, body.history)
        escalate = any(word in body.question.lower() for word in ("human", "agent", "complaint", "representative"))
        return {"answer": answer, "escalate": escalate}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=502, detail="Support AI request failed; check service logs.")
    