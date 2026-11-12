
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings


# PostgreSQL engine configured for Supabase connections
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=3,
    max_overflow=2,
    pool_timeout=30,
    connect_args={
        "connect_timeout": 10,
        "sslmode": "require",
    },
)

# Database sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

# Base class for SQLAlchemy models
Base = declarative_base()


# FastAPI database dependency
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
