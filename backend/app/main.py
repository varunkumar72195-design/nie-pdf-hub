
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.routes.analytics import router as analytics_router
from app.routes.admin import router as admin_router
from app.routes.departments import router as department_router
from app.routes.academic_years import router as academic_year_router
from app.routes.semesters import router as semester_router
from app.routes.subjects import router as subject_router
from app.routes.materials import router as material_router
from app.routes.announcements import router as announcement_router


app = FastAPI(
    title="NIE PDF HUB API",
    description="Academic Study Material Portal",
    version="1.0.0"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://nie-pdf-hub-6vi5.vercel.app",
        "https://nie-pdf-hub-6vi5-git-main-itzmeevaruns-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register API routers
app.include_router(admin_router)
app.include_router(department_router)
app.include_router(academic_year_router)
app.include_router(semester_router)
app.include_router(subject_router)
app.include_router(material_router)
app.include_router(announcement_router)
app.include_router(analytics_router)

# Home route
@app.get("/")
async def home():
    return {
        "message": "Welcome to NIE PDF HUB API",
        "status": "running"
    }


# API health check
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "project": "NIE PDF HUB"
    }


# Database health check
@app.get("/api/health/database")
async def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "database": "connected",
            "type": "PostgreSQL"
        }

    except Exception:
        return {
            "database": "disconnected"
        }
