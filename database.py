import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
import certifi

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

if not MONGODB_URL:
    raise ValueError("MONGODB_URL is missing in .env file")

if not DATABASE_NAME:
    raise ValueError("DATABASE_NAME is missing in .env file")

client = MongoClient(
    MONGODB_URL,
    tlsCAFile=certifi.where()
)

db = client[DATABASE_NAME]