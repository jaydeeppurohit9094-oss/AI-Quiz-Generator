from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from database import db
import bcrypt
import jwt
import os
from datetime import datetime, timedelta

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALGORITHM = "HS256"


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    college: str = ""
    semester: str = ""
    department: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def create_token(user_id):
    payload = {
        "user_id": str(user_id),
        "exp": datetime.utcnow() + timedelta(days=1)
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


@router.post("/register")
def register_user(user: RegisterRequest):

    existing_user = db.users.find_one({
        "email": user.email
    })

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )

    hashed_password = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt()
    )

    user_data = {
        "name": user.name,
        "email": user.email,
        "password": hashed_password.decode("utf-8"),
        "college": user.college,
        "semester": user.semester,
        "department": user.department,
        "created_at": datetime.utcnow()
    }

    result = db.users.insert_one(user_data)

    return {
        "status": "success",
        "message": "Registration successful.",
        "user_id": str(result.inserted_id)
    }


@router.post("/login")
def login_user(credentials: LoginRequest):

    user = db.users.find_one({
        "email": credentials.email
    })

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    password_correct = bcrypt.checkpw(
        credentials.password.encode("utf-8"),
        user["password"].encode("utf-8")
    )

    if not password_correct:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    token = create_token(user["_id"])

    return {
        "status": "success",
        "message": "Login successful.",
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"]
        }
    }