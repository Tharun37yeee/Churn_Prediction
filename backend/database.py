"""
database.py
-----------
SQLAlchemy engine, session factory and declarative base for the Churn Predict backend.
The DATABASE_URL is read from the environment (populated via python-dotenv in main.py / seed.py).
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Load .env file from the current directory or parent directory
load_dotenv(dotenv_path=Path(__file__).parent / ".env")
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")

# ---------------------------------------------------------------------------
# Engine & session factory
# ---------------------------------------------------------------------------

DATABASE_URL: str = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in environment or .env file.")


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,       # verify connections before use
    pool_size=5,
    max_overflow=10,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)


# ---------------------------------------------------------------------------
# Declarative base
# ---------------------------------------------------------------------------

class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_db():
    """
    Yield a SQLAlchemy session for use as a FastAPI dependency.
    Ensures the session is always closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
