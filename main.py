from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import client
from auth import router as auth_router
from profile import router as profile_router

app = FastAPI(
    title="AI Quiz Generator API",
    description="Backend API for AI Quiz Generator",
    version="1.0.0"
)

app.include_router(profile_router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "AI Quiz Generator Backend is running!"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "success",
        "message": "Backend is healthy"
    }


@app.get("/test-db")
def test_database():
    try:
        client.admin.command("ping")

        return {
            "status": "success",
            "message": "MongoDB connected successfully"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


app.include_router(auth_router)