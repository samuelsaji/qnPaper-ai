"""
Question Generation Engine
===========================
Flow:
  1. PromptGenerator builds full context prompt from MongoDB
  2. Gemini generates structured question paper JSON
  3. Returns parsed result

Works for any subject — pulls syllabus + PYQ from DB automatically.
"""

from __future__ import annotations

import json
import os
import sys
import re

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from google import genai
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"), override=True)


def _get_client():
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_GEMINI_API_KEY not set in .env")
    return genai.Client(api_key=api_key)


def generate_question_paper(
    template_id: str,
    custom_instructions: str = None,
) -> dict:
    """
    Generate a complete new question paper.

    Args:
        template_id        : MongoDB _id of the template
        custom_instructions: Optional focus e.g. "only Module 3 topics"

    Returns:
        {
          "questions": [
            {
              "question_number": "1",
              "question_text": "...",
              "marks": 5,
              "difficulty": "easy",
              "topic": "...",
              "type": "short_answer"
            }
          ],
          "total_marks": 50,
          "question_count": 10,
          "coverage": {
            "modules_covered": [...],
            "topics_covered": [...]
          }
        }
    """
    from .prompt_generator import PromptGenerator

    print(f"\n{'='*60}")
    print("QUESTION PAPER GENERATION ENGINE")
    print(f"{'='*60}")
    print(f"Template ID : {template_id}")

    # Step 1: Build prompt from DB data
    print("\n[1] Building prompt...")
    pg = PromptGenerator()
    prompt = pg.generate_prompt(
        template_id=template_id,
        custom_instructions=custom_instructions,
    )

    if not prompt:
        print("  ERROR: Could not build prompt.")
        print("  Possible reasons:")
        print("    - template_id does not exist in MongoDB")
        print("    - Template has not been processed yet (no syllabus data)")
        print("    - No question papers uploaded for this template")
        return {}

    print(f"  Prompt ready ({len(prompt):,} chars)")

    # Step 2: Call Gemini
    print("[2] Calling Gemini 2.5 Flash...")
    client = _get_client()
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        raw = response.text.strip()
    except Exception as e:
        print(f"  Gemini API error: {e}")
        return {}

    # Step 3: Clean and parse JSON
    # Strip markdown code fences if Gemini adds them despite instructions
    if raw.startswith("```"):
        lines = raw.split("\n")
        inner = lines[1:] if lines[0].startswith("```") else lines
        if inner and inner[-1].strip() == "```":
            inner = inner[:-1]
        raw = "\n".join(inner)

    # Sometimes Gemini adds text before the JSON — find the first {
    json_start = raw.find("{")
    if json_start > 0:
        raw = raw[json_start:]

    try:
        result = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"  JSON parse failed: {e}")
        print(f"  Raw response preview:\n{raw[:400]}")
        return {}

    # Ensure question_count is accurate
    questions = result.get("questions", [])
    result["question_count"] = len(questions)

    print(f"  Generated {len(questions)} questions successfully")

    # Print summary
    if questions:
        total = sum(q.get("marks", 0) for q in questions)
        print(f"  Total marks in paper: {total}")
        types = set(q.get("type", "") for q in questions)
        print(f"  Question types: {', '.join(types)}")

    return result