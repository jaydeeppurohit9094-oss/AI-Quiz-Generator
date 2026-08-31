from fastapi import APIRouter
from database import db

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("/")
async def get_profile():
    user = await db["users"].find_one({})

    if not user:
        return {
            "message": "No user found"
        }

    return {
        "name": user.get("name"),
        "email": user.get("email"),
        "college": user.get("college"),
        "semester": user.get("semester"),
        "department": user.get("department"),
        "profile_photo": user.get("profile_photo")
    }