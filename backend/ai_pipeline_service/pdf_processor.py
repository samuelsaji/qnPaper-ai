from google import genai
import os
import json
from dotenv import load_dotenv

load_dotenv()


def _get_client():
    api_key = os.getenv("GOOGLE_GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_GEMINI_API_KEY not set in .env")
    return genai.Client(api_key=api_key)


SYLLABUS_PROMPT = """You are an expert at analyzing academic syllabus documents.

Your task is to extract and structure the following information from the provided PDF into JSON format.

────────────────────────────
WHAT TO EXTRACT
────────────────────────────

1. **Course Information:**
   - Course Code (e.g., HUT 300, CS101)
   - Course Name (full title)

2. **Modules:**
   - Module names (e.g., Module 1, Module 2, Module 3)
   - For each module, extract all topics

3. **Topics:**
   - Topic name
   - Subtopics (key concepts, definitions, features covered)
   - A concise summary (2-3 sentences) of what the topic covers

────────────────────────────
EXTRACTION RULES
────────────────────────────
1. Extract ALL modules mentioned in the syllabus
2. For each module, list ALL topics covered
3. For each topic, identify key subtopics and concepts
4. Create a brief, informative summary for each topic
5. Maintain the original structure and hierarchy
6. Use exact names as they appear in the document
7. If course code is not found, use "UNKNOWN"

────────────────────────────
OUTPUT FORMAT (JSON)
────────────────────────────
Return ONLY valid JSON in this exact structure:

{
  "courses": [
    {
      "course_code": "HUT 300",
      "course_name": "Introduction to Economics",
      "modules": [
        {
          "module_name": "Module 1",
          "topics": [
            {
              "topic_name": "Perfect Competition",
              "subtopics": [
                "Features of perfect competition",
                "Price determination",
                "Equilibrium"
              ],
              "summary": "This topic covers the characteristics of perfectly competitive markets."
            }
          ]
        }
      ]
    }
  ]
}

CRITICAL:
- Return ONLY valid JSON, no other text
- Include ALL modules and topics
- Be thorough and accurate
- Maintain the hierarchical structure"""


def process_syllabus_pdf(pdf_path: str) -> dict:
    print(f"📄 Uploading PDF: {pdf_path}")
    client = _get_client()
    uploaded = client.files.upload(file=pdf_path)
    print(f"✅ Uploaded: {uploaded.name}")

    print("🤖 Extracting syllabus structure with Gemini...")
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[SYLLABUS_PROMPT, uploaded],
    )

    response_text = response.text.strip()

    # Strip markdown code fences if present
    if response_text.startswith("```"):
        response_text = response_text.split("```")[1]
        if response_text.startswith("json"):
            response_text = response_text[4:]

    result = json.loads(response_text)

    if "courses" not in result:
        raise ValueError("Invalid JSON structure: missing 'courses' key")

    total_modules = sum(len(c.get("modules", [])) for c in result["courses"])
    total_topics = sum(
        len(m.get("topics", []))
        for c in result["courses"]
        for m in c.get("modules", [])
    )
    print(f"✓ Extracted {len(result['courses'])} course(s), {total_modules} module(s), {total_topics} topic(s)")

    return result


def process_pdf_to_json(pdf_path: str) -> dict:
    print(f"\n{'='*60}")
    print(f"📝 Processing Syllabus: {pdf_path}")
    print(f"{'='*60}\n")

    result = process_syllabus_pdf(pdf_path)

    print(f"\n{'='*60}")
    print("✅ SYLLABUS PROCESSING COMPLETE")
    print(f"{'='*60}\n")

    return result


if __name__ == "__main__":
    test_pdf = "testing_pdf/sample.pdf"
    if os.path.exists(test_pdf):
        result = process_pdf_to_json(test_pdf)
        print(json.dumps(result, indent=2))
    else:
        print(f"Test PDF not found: {test_pdf}")
