
from pathlib import Path
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4
from datetime import datetime, timedelta
import jwt
from bson import ObjectId
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Header,
    HTTPException,
)
from fastapi.middleware.cors import CORSMiddleware

from database import client, db
from auth import router as auth_router, JWT_SECRET, JWT_ALGORITHM
from profile import router as profile_router
from quiz_generator import extract_text, generate_quiz
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends
# --------------------------------------------------
# 1. FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="AI Quiz Generator API",
    description="Backend API for AI Quiz Generator",
    version="1.0.0",
)
security = HTTPBearer(
    scheme_name="BearerAuth",
    description="Enter your login token here."
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)


# --------------------------------------------------
# 2. FILE UPLOAD CONFIGURATION
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".txt"}


# --------------------------------------------------
# QUIZ SUBMISSION MODEL
# --------------------------------------------------

class QuizSubmission(BaseModel):
    answers: list[int | None] = Field(min_length=1, max_length=20)



# --------------------------------------------------
# 3. HELPER: VERIFY LOGIN TOKEN
# --------------------------------------------------

def get_authenticated_user(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Please log in before using this feature.",
        )

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = payload.get("user_id")

        if not user_id:
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

    return user_object_id

    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
        )

        user_id = payload.get("user_id")

        if not user_id:
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

    return user_object_id


# --------------------------------------------------
# 4. HOME AND HEALTH ENDPOINTS
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "AI Quiz Generator Backend is running!"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "success",
        "message": "Backend is healthy",
    }


@app.get("/test-db")
def test_database():
    try:
        client.admin.command("ping")
        return {
            "status": "success",
            "message": "MongoDB connected successfully",
        }
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="MongoDB connection failed.",
        )


# --------------------------------------------------
# 5. UPLOAD STUDY MATERIAL
# --------------------------------------------------

@app.post("/api/materials/upload")
async def upload_material(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_object_id = get_authenticated_user(
        f"Bearer {credentials.credentials}"
    )

    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if not original_name or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, DOCX, PPTX and TXT files are allowed.",
        )

    stored_name = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / stored_name
    size_bytes = 0

    try:
        with file_path.open("wb") as destination:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                size_bytes += len(chunk)

                if size_bytes > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=413,
                        detail="File is too large. Maximum size is 100 MB.",
                    )

                destination.write(chunk)

        if size_bytes == 0:
            raise HTTPException(
                status_code=400,
                detail="The selected file is empty.",
            )

        material_data = {
            "user_id": str(user_object_id),
            "original_filename": original_name,
            "stored_filename": stored_name,
            "file_type": extension.lstrip("."),
            "size_bytes": size_bytes,
            "uploaded_at": datetime.utcnow(),
            "status": "uploaded",
        }

        result = db.materials.insert_one(material_data)

        return {
            "status": "success",
            "message": "File uploaded successfully.",
            "material": {
                "id": str(result.inserted_id),
                "filename": original_name,
                "file_type": extension.lstrip("."),
                "size_bytes": size_bytes,
                "status": "uploaded",
            },
        }

    except HTTPException:
        if file_path.exists():
            file_path.unlink()
        raise

    except Exception:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="File upload failed. Please try again.",
        )

    finally:
        await file.close()


# --------------------------------------------------
# 6. GENERATE QUIZ FROM UPLOADED MATERIAL
# --------------------------------------------------

@app.post("/api/materials/{material_id}/generate-quiz")
def generate_quiz_for_material(
    material_id: str,
    question_count: int = 5,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_object_id = get_authenticated_user(
        f"Bearer {credentials.credentials}"
    )

    if question_count < 1 or question_count > 20:
        raise HTTPException(
            status_code=400,
            detail="Question count must be between 1 and 20.",
        )

    try:
        material_object_id = ObjectId(material_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid material ID.",
        )

    # Find only material belonging to the logged-in user.
    material = db.materials.find_one({
        "_id": material_object_id,
        "user_id": str(user_object_id),
    })

    if not material:
        raise HTTPException(
            status_code=404,
            detail="Material not found for this account.",
        )

    # Find the uploaded file.
    stored_name = material.get("stored_filename", "")
    file_path = UPLOAD_DIR / stored_name

    if (
        not stored_name
        or file_path.parent != UPLOAD_DIR
        or not file_path.is_file()
    ):
        raise HTTPException(
            status_code=404,
            detail="Uploaded file is missing. Please upload it again.",
        )

    # Extract text from PDF, DOCX, PPTX or TXT.
    try:
        material_text = extract_text(str(file_path))

        if not material_text.strip():
            raise HTTPException(
                status_code=422,
                detail=(
                    "No readable text found. "
                    "Scanned PDFs may require OCR."
                ),
            )

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="Could not read this file. Please check its format.",
        )

    # Generate MCQs using Gemini.
    try:
        questions = generate_quiz(
            material_text,
            question_count=question_count,
        )

        if not isinstance(questions, list) or len(questions) != question_count:
            raise ValueError("Unexpected number of questions.")

        # Validate each question before saving.
        for question in questions:
            if not isinstance(question, dict):
                raise ValueError("Invalid question format.")

            if not isinstance(question.get("question"), str):
                raise ValueError("Invalid question text.")

            options = question.get("options")
            if (
                not isinstance(options, list)
                or len(options) != 4
                or not all(isinstance(option, str) for option in options)
            ):
                raise ValueError("Each question must have four text options.")

            if not isinstance(question.get("correct_answer"), str):
                raise ValueError("Invalid correct answer.")

            if question["correct_answer"] not in options:
                raise ValueError("Correct answer must match one option.")

            if not isinstance(question.get("explanation"), str):
                raise ValueError("Invalid explanation.")

    except Exception:
        raise HTTPException(
            status_code=502,
            detail="AI quiz generation failed. Please try again.",
        )

    # Save quiz in MongoDB.
    quiz_data = {
        "user_id": str(user_object_id),
        "material_id": str(material_object_id),
        "title": f"Quiz - {material['original_filename']}",
        "question_count": len(questions),
        "questions": questions,
        "created_at": datetime.utcnow(),
    }

    try:
        result = db.quizzes.insert_one(quiz_data)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Quiz was generated but could not be saved.",
        )

    return {
        "status": "success",
        "message": "Quiz generated and saved successfully.",
        "quiz": {
            "id": str(result.inserted_id),
            "title": quiz_data["title"],
            "material_id": str(material_object_id),
            "question_count": len(questions),
            "questions": questions,
        },
    }

# --------------------------------------------------
# 7. GET ALL MATERIALS FOR LOGGED-IN USER
# --------------------------------------------------

@app.get("/api/materials")
def get_materials(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_object_id = get_authenticated_user(
        f"Bearer {credentials.credentials}"
    )

    materials = db.materials.find(
        {"user_id": str(user_object_id)}
    ).sort("uploaded_at", -1)

    result = []

    for material in materials:
        result.append({
            "id": str(material["_id"]),
            "filename": material.get("original_filename", ""),
            "file_type": material.get("file_type", ""),
            "size_bytes": material.get("size_bytes", 0),
            "status": material.get("status", "uploaded"),
            "uploaded_at": material.get("uploaded_at"),
        })

    return {
        "status": "success",
        "count": len(result),
        "materials": result,
    }


# --------------------------------------------------
# 8. GET ALL QUIZZES FOR LOGGED-IN USER
# --------------------------------------------------

@app.get("/api/quizzes")
def get_quizzes(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_object_id = get_authenticated_user(
        f"Bearer {credentials.credentials}"
    )

    quizzes = db.quizzes.find(
        {"user_id": str(user_object_id)}
    ).sort("created_at", -1)

    result = []

    for quiz in quizzes:
        result.append({
            "id": str(quiz["_id"]),
            "title": quiz.get("title", "Untitled Quiz"),
            "material_id": quiz.get("material_id", ""),
            "question_count": quiz.get("question_count", 0),
            "created_at": quiz.get("created_at"),
        })

    return {
        "status": "success",
        "count": len(result),
        "quizzes": result,
    }


# --------------------------------------------------
# 9. SUBMIT QUIZ AND SAVE RESULT
# --------------------------------------------------


# 9. SUBMIT QUIZ AND SAVE RESULT

@app.post("/api/quizzes/{quiz_id}/submit")
def submit_quiz(
    quiz_id: str,
    submission: QuizSubmission,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_object_id = get_authenticated_user(
        f"Bearer {credentials.credentials}"
    )

    try:
        quiz_object_id = ObjectId(quiz_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid quiz ID",
        )

    quiz = db.quizzes.find_one({
        "_id": quiz_object_id,
        "user_id": str(user_object_id),
    })

    if not quiz:
        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    questions = quiz.get("questions", [])

    if len(submission.answers) != len(questions):
        raise HTTPException(
            status_code=400,
            detail=f"Please submit exactly {len(questions)} answers",
        )

    correct_count = 0
    wrong_count = 0
    skipped_count = 0

    for index, question in enumerate(questions):
        answer_index = submission.answers[index]

        if answer_index is None:
            skipped_count += 1
            continue

        options = question.get("options", [])

        if (
            not isinstance(answer_index, int)
            or isinstance(answer_index, bool)
            or answer_index < 0
            or answer_index >= len(options)
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid answer for question {index + 1}",
            )

        selected_answer = options[answer_index]
        correct_answer = question.get("correct_answer")

        if selected_answer == correct_answer:
            correct_count += 1
        else:
            wrong_count += 1

    total_questions = len(questions)

    percentage = (
        round((correct_count / total_questions) * 100, 2)
        if total_questions > 0
        else 0
    )

    attempt = {
        "user_id": str(user_object_id),
        "quiz_id": str(quiz_object_id),
        "quiz_title": quiz.get("title", "Untitled Quiz"),
        "material_id": quiz.get("material_id"),
        "question_count": total_questions,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "skipped_count": skipped_count,
        "score": correct_count,
        "percentage": percentage,
        "submitted_at": datetime.utcnow(),
    }

    result = db.quiz_attempts.insert_one(attempt)

    return {
        "status": "success",
        "message": "Quiz submitted successfully",
        "attempt_id": str(result.inserted_id),
        "quiz_title": attempt["quiz_title"],
        "total_questions": total_questions,
        "correct_count": correct_count,
        "wrong_count": wrong_count,
        "skipped_count": skipped_count,
        "score": correct_count,
        "percentage": percentage,
    }

# --------------------------------------------------
# 10. GET QUIZ HISTORY / COMPLETED ATTEMPTS
# --------------------------------------------------

@app.get("/api/debug/quiz-attempts")
def debug_quiz_attempts(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_object_id = get_authenticated_user(
        f"Bearer {credentials.credentials}"
    )

    return {
        "database": db.name,
        "collection": db.quiz_attempts.name,
        "current_user_id": str(user_object_id),
        "total_attempts": db.quiz_attempts.count_documents({}),
        "user_attempts": db.quiz_attempts.count_documents({
            "user_id": str(user_object_id)
        }),
    }
# --------------------------------------------------
# 11. DASHBOARD STATISTICS
# --------------------------------------------------

@app.get("/api/dashboard/stats")
def get_dashboard_stats(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_object_id = get_authenticated_user(
        f"Bearer {credentials.credentials}"
    )

    user_filter = {"user_id": str(user_object_id)}

    total_quizzes = db.quizzes.count_documents(user_filter)
    total_attempts = db.quiz_attempts.count_documents(user_filter)

    pipeline = [
        {"$match": user_filter},
        {
            "$group": {
                "_id": None,
                "average_score": {"$avg": "$percentage"},
                "highest_score": {"$max": "$percentage"},
            }
        },
    ]

    stats = list(db.quiz_attempts.aggregate(pipeline))

    average_score = 0
    highest_score = 0

    if stats:
        average_score = round(stats[0].get("average_score") or 0, 2)
        highest_score = round(stats[0].get("highest_score") or 0, 2)

    return {
        "status": "success",
        "total_quizzes": total_quizzes,
        "total_attempts": total_attempts,
        "average_score": average_score,
        "highest_score": highest_score,
    }


# 11. PERFORMANCE PAGE API

@app.get("/api/performance")
def get_performance(
    period: str = "30d",
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_object_id = get_authenticated_user(
        f"Bearer {credentials.credentials}"
    )

    user_filter = {"user_id": str(user_object_id)}

    now = datetime.utcnow()

    if period == "7d":
        start_date = now - timedelta(days=7)
    elif period == "30d":
        start_date = now - timedelta(days=30)
    elif period == "3m":
        start_date = now - timedelta(days=90)
    elif period == "all":
        start_date = None
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid period. Use 7d, 30d, 3m, or all.",
        )

    attempt_filter = user_filter.copy()

    if start_date:
        attempt_filter["submitted_at"] = {"$gte": start_date}

    attempts = list(
        db.quiz_attempts.find(
            attempt_filter,
            {"_id": 1, "quiz_id": 1, "quiz_title": 1,
             "question_count": 1, "correct_count": 1,
             "wrong_count": 1, "skipped_count": 1,
             "score": 1, "percentage": 1, "submitted_at": 1}
        ).sort("submitted_at", -1)
    )

    total_attempts = len(attempts)

    total_questions = sum(
        item.get("question_count", 0) for item in attempts
    )
    total_correct = sum(
        item.get("correct_count", 0) for item in attempts
    )
    total_wrong = sum(
        item.get("wrong_count", 0) for item in attempts
    )
    total_skipped = sum(
        item.get("skipped_count", 0) for item in attempts
    )

    average_score = (
        round(
            sum(item.get("percentage", 0) for item in attempts)
            / total_attempts,
            2,
        )
        if total_attempts else 0
    )

    best_score = max(
        (item.get("percentage", 0) for item in attempts),
        default=0,
    )

    accuracy = (
        round(total_correct / total_questions * 100, 2)
        if total_questions else 0
    )

    recent_quizzes = []

    for item in attempts[:10]:
        recent_quizzes.append({
            "id": str(item["_id"]),
            "quiz_id": item.get("quiz_id"),
            "title": item.get("quiz_title", "Untitled Quiz"),
            "question_count": item.get("question_count", 0),
            "correct_count": item.get("correct_count", 0),
            "wrong_count": item.get("wrong_count", 0),
            "skipped_count": item.get("skipped_count", 0),
            "percentage": item.get("percentage", 0),
            "submitted_at": item.get("submitted_at"),
        })

    return {
        "status": "success",
        "period": period,
        "average_score": average_score,
        "quizzes_completed": total_attempts,
        "questions_correct": total_correct,
        "questions_wrong": total_wrong,
        "questions_skipped": total_skipped,
        "total_questions": total_questions,
        "accuracy": accuracy,
        "best_score": best_score,
        "recent_quizzes": recent_quizzes,
    }
