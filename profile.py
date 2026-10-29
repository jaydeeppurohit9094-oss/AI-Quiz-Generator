
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from bson import ObjectId

from database import db
from auth import JWT_SECRET, JWT_ALGORITHM
import jwt


router = APIRouter(prefix="/profile", tags=["Profile"])


# --------------------------------------------------
# AUTHENTICATION
# --------------------------------------------------

def get_current_profile_user(
   credentials: HTTPAuthorizationCredentials = Depends(security),
    
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = payload.get("user_id")

        if not user_id or not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=401,
                detail="Invalid login token.",
            )

        user_object_id = ObjectId(user_id)

    except HTTPException:
        raise
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token. Please log in again.",
        )

    user = db.users.find_one({"_id": user_object_id})

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User account not found. Please log in again.",
        )

    return user


# --------------------------------------------------
# PROFILE UPDATE MODEL
# --------------------------------------------------

class ProfileUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    college: str = Field(default="", max_length=200)
    semester: str = Field(default="", max_length=30)
    department: str = Field(default="", max_length=100)


# --------------------------------------------------
# GET LOGGED-IN USER PROFILE
# --------------------------------------------------

@router.get("/")
def get_profile(
    user: dict = Depends(get_current_profile_user),
):
    return {
        "status": "success",
        "profile": {
            "id": str(user["_id"]),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "college": user.get("college", ""),
            "semester": user.get("semester", ""),
            "department": user.get("department", ""),
            "profile_photo": user.get("profile_photo"),
            "created_at": user.get("created_at"),
        },
    }


# --------------------------------------------------
# UPDATE LOGGED-IN USER PROFILE
# --------------------------------------------------

@router.put("/")
def update_profile(
    profile: ProfileUpdateRequest,
    user: dict = Depends(get_current_profile_user),
):
    user_id = user["_id"]

    # Prevent another account from using the same email.
    existing_user = db.users.find_one({
        "email": profile.email,
        "_id": {"$ne": user_id},
    })

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="This email is already registered.",
        )

    updated_data = {
        "name": profile.name.strip(),
        "email": str(profile.email),
        "college": profile.college.strip(),
        "semester": profile.semester.strip(),
        "department": profile.department.strip(),
    }

    if not updated_data["name"]:
        raise HTTPException(
            status_code=422,
            detail="Name cannot be empty.",
        )

    db.users.update_one(
        {"_id": user_id},
        {"$set": updated_data},
    )

    updated_user = db.users.find_one({"_id": user_id})

    return {
        "status": "success",
        "message": "Profile updated successfully.",
        "profile": {
            "id": str(updated_user["_id"]),
            "name": updated_user.get("name", ""),
            "email": updated_user.get("email", ""),
            "college": updated_user.get("college", ""),
            "semester": updated_user.get("semester", ""),
            "department": updated_user.get("department", ""),
            "profile_photo": updated_user.get("profile_photo"),
            "created_at": updated_user.get("created_at"),
        },
    }
