
from pathlib import Path
from dotenv import load_dotenv
from google import genai
import os

# Load .env from the project folder
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY .env file ma mali nathi.")
    raise SystemExit(1)

try:
    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents="Create one simple MCQ about Python. Give four options and identify the correct answer."
    )

    print("\nSUCCESS: Gemini API connected!")
    print("\nAI Response:\n")
    print(response.text)

except Exception as error:
    print("\nERROR: Gemini API request failed.")
    print("Details:", str(error))
