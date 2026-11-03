import os
import re
import sqlite3
import time
import random
from app.database import DB_PATH
from google import genai
from dotenv import load_dotenv
from google.genai import errors

load_dotenv()

key = os.getenv("GEMINI_API_KEY")

if not key:
    raise RuntimeError("GEMINI_API_KEY is missing. Check your ai-service/.env file.")

client = genai.Client(api_key=key)

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)
SCHEMA = "students(id, name, course, marks); orders(id, customer, product, status, total)"


def generate_sql(question: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    client = genai.Client(api_key=api_key)

    prompt = (
        "Translate the question into one SQLite query. "
        "Only SELECT or WITH. "
        "No markdown, comments, or explanation. "
        "Use only this schema: "
        + SCHEMA
        + "\nQuestion: "
        + question
    )

    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )

            if not response.text:
                raise RuntimeError("Gemini returned an empty response")

            return response.text.strip()

        except errors.ServerError as exc:
            # Retry temporary server errors
            if attempt == 2:
                raise

            delay = (2 ** attempt) + random.uniform(0, 1)
            print(
                f"Gemini temporarily unavailable. "
                f"Retrying in {delay:.1f} seconds..."
            )
            time.sleep(delay)

    raise RuntimeError("Gemini SQL generation failed")

def validate_sql(sql: str):
    if not re.match(r"(?is)^\s*(SELECT|WITH)\b", sql):
        raise ValueError("Only SELECT or WITH queries are allowed.")
    if ";" in sql.rstrip(";"):
        raise ValueError("Only one SQL statement is allowed.")
    if re.search(r"(?i)\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|REPLACE|ATTACH|DETACH|PRAGMA|VACUUM)\b", sql):
        raise ValueError("Unsafe SQL was blocked.")

def execute_sql(sql: str):
    validate_sql(sql)
    with sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True) as con:
        con.set_progress_handler(lambda: 1, 500000)
        con.row_factory = sqlite3.Row
        cursor = con.execute(sql)
        rows = [dict(row) for row in cursor.fetchmany(101)]
        columns = [col[0] for col in cursor.description or []]
    return {"columns": columns, "rows": rows[:100], "truncated": len(rows) > 100}

def ask_database(question: str):
    sql = generate_sql(question)
    return {"question": question, "sql": sql, **execute_sql(sql)}
