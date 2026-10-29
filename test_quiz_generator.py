
from quiz_generator import extract_text, generate_quiz

text = extract_text("sample.txt")
questions = generate_quiz(text, question_count=3)

for index, question in enumerate(questions, start=1):
    print(f"\nQuestion {index}: {question['question']}")
    for option in question["options"]:
        print("-", option)
    print("Correct answer:", question["correct_answer"])
    print("Explanation:", question["explanation"])
