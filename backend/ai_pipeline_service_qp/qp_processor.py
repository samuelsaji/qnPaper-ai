from google import genai
import os
import sys
from dotenv import load_dotenv
from typing import List
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ai_pipeline_service_qp.schemas import ProcessedQuestionPaper, Question
except ImportError:
    from schemas import ProcessedQuestionPaper, Question

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)


def _get_client():
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_GEMINI_API_KEY not set in .env")
    return genai.Client(api_key=api_key)


QP_PROMPT = """You are an expert at extracting questions from academic question papers.

**EXTRACT EVERY SINGLE QUESTION** from the PDF. Do NOT skip any question.

For EACH question:
1. Question number (1, 2, 3, etc. or 1a, 2b, etc. for sub-questions)
2. Complete question text - copy EXACTLY as written
3. Marks - extract the marks value (just the number, e.g., 5 not "5 marks")
4. Sub-questions - if parts a), b), c) exist, include them as separate questions

CRITICAL RULES:
- Read ALL pages
- Extract ALL questions
- Preserve exact text
- Include all sub-questions as separate entries
- Extract marks as numbers only
- Do NOT skip any question

OUTPUT FORMAT (JSON):
Return a JSON array of objects with this exact structure:
[
  {
    "question_number": "1",
    "question_text": "Complete question text here",
    "marks": 5
  },
  {
    "question_number": "2a",
    "question_text": "Sub-question text",
    "marks": 3
  }
]

Return ONLY valid JSON, no other text."""


def extract_questions_from_pdf(pdf_path: str) -> List[dict]:
    print(f"📄 Uploading Question Paper: {pdf_path}")
    client = _get_client()
    uploaded = client.files.upload(file=pdf_path)
    print(f"✅ Uploaded: {uploaded.name}")

    print("🤖 Extracting questions with Gemini...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[QP_PROMPT, uploaded],
    )

    response_text = response.text.strip()
    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]

    try:
        questions = json.loads(response_text)
        print(f"✓ Extracted {len(questions)} questions")
        return questions
    except json.JSONDecodeError as e:
        print(f"⚠️  Failed to parse JSON: {e}")
        print(f"Response preview: {response.text[:500]}")
        return []


def structure_with_groq(questions: List[dict]) -> ProcessedQuestionPaper:
    print("🔄 Structuring questions...")
    question_objects = []
    for q in questions:
        try:
            question_objects.append(Question(
                question_number=str(q.get("question_number", "")),
                question_text=q.get("question_text", ""),
                marks=int(q.get("marks", 0)),
            ))
        except Exception as e:
            print(f"⚠️  Skipping invalid question: {e}")
    result = ProcessedQuestionPaper(questions=question_objects)
    print(f"✓ Structured {len(result.questions)} question(s)")
    return result


def process_qp_to_json(pdf_path: str) -> dict:
    print(f"\n{'='*60}")
    print(f"📝 Processing Question Paper: {pdf_path}")
    print(f"{'='*60}\n")

    questions = extract_questions_from_pdf(pdf_path)
    if not questions:
        print("❌ No questions extracted from PDF")
        return {"questions": []}

    structured_result = structure_with_groq(questions)

    print(f"\n{'='*60}")
    print("✅ QUESTION PAPER PROCESSING COMPLETE")
    print(f"{'='*60}\n")

    return structured_result.model_dump()


if __name__ == "__main__":
    test_pdf = "ai_pipeline_service_qp/testing_pdf/ieft_sample.pdf"
    if os.path.exists(test_pdf):
        result = process_qp_to_json(test_pdf)
        print(json.dumps(result, indent=2))
    else:
        print(f"Test PDF not found: {test_pdf}")
