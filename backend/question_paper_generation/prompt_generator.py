"""
Prompt Generator
================
Builds the full generation prompt from MongoDB data:
  - PYQ questions  → question_papers collection
  - Syllabus       → template_results collection  
  - Template info  → templates collection

MongoDB structure (from actual data):
  template_results.results = [
    {
      "courses": [
        {
          "course_code": "...",
          "course_name": "...",
          "modules": [
            {
              "module_name": "...",
              "topics": [
                {
                  "topic_name": "...",
                  "subtopics": [...],
                  "summary": "..."
                }
              ]
            }
          ]
        }
      ]
    }
  ]

  question_papers.questions = [
    {
      "question_number": "1",
      "question_text": "...",
      "marks": 5
    }
  ]
"""

import os
import sys
import json
from typing import List, Dict, Optional, Any
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database.db_connection import get_database
from bson import ObjectId


class PromptGenerator:

    def __init__(self):
        self.db = get_database()
        self.templates = self.db["templates"]
        self.question_papers = self.db["question_papers"]
        self.template_results = self.db["template_results"]

    # ------------------------------------------------------------------
    # Data fetchers
    # ------------------------------------------------------------------

    def get_template_info(self, template_id: str) -> Dict[str, Any]:
        """Get template name and total_marks from templates collection."""
        try:
            doc = self.templates.find_one({"_id": ObjectId(template_id)})
            if doc:
                return {
                    "template_id": str(doc["_id"]),
                    "name": doc.get("name", "Unknown"),
                    "total_marks": doc.get("total_marks", 0),
                }
        except Exception as e:
            print(f"  [PromptGenerator] template fetch error: {e}")
        return {}

    def get_pvq_questions(self, template_id: str) -> List[Dict[str, Any]]:
        """
        Get all extracted PYQ questions from question_papers collection.
        Handles both flat and nested question structures.
        """
        doc = self.question_papers.find_one({"template_id": template_id})
        if not doc or "questions" not in doc:
            return []

        questions = []
        for item in doc["questions"]:
            if not isinstance(item, dict):
                continue
            if "questions" in item:
                # Nested: [{questions: [{question_number, question_text, marks}]}]
                questions.extend(item["questions"])
            elif "question_text" in item or "question_number" in item:
                # Flat: [{question_number, question_text, marks}]
                questions.append(item)

        return questions

    def get_syllabus(self, template_id: str) -> List[Dict[str, Any]]:
        """
        Get syllabus from template_results collection.
        Returns the results list directly.
        """
        doc = self.template_results.find_one({"template_id": template_id})
        if doc and "results" in doc:
            results = doc["results"]
            return results if isinstance(results, list) else [results]
        return []

    # ------------------------------------------------------------------
    # Formatters
    # ------------------------------------------------------------------

    def _format_pvq(self, questions: List[Dict[str, Any]]) -> str:
        if not questions:
            return "No Previous Year Questions available.\n"

        total_marks = sum(
            int(q.get("marks", 0)) for q in questions
            if str(q.get("marks", "")).isdigit() or isinstance(q.get("marks"), (int, float))
        )

        lines = [
            "## PREVIOUS YEAR QUESTIONS (PVQ)\n",
            f"Total Questions: {len(questions)}",
            f"Total Marks: {total_marks if total_marks > 0 else 'Not specified'}\n",
        ]

        for i, q in enumerate(questions, 1):
            q_num = q.get("question_number", str(i))
            q_text = q.get("question_text", "").strip()
            q_marks = q.get("marks")
            lines.append(f"Q{q_num}: {q_text}")
            if q_marks:
                lines.append(f"   Marks: {q_marks}")
            lines.append("")

        return "\n".join(lines)

    def _format_syllabus(self, results: List[Dict[str, Any]]) -> str:
        if not results:
            return "No syllabus data available.\n"

        lines = ["## COURSE SYLLABUS AND CONTENT COVERAGE\n"]

        for result_item in results:
            # Each result_item is like {"courses": [...]}
            courses = result_item.get("courses", [])
            for course in courses:
                course_name = course.get("course_name", "")
                course_code = course.get("course_code", "")
                lines.append(f"### Course: {course_name} ({course_code})\n")

                for module in course.get("modules", []):
                    lines.append(f"#### {module.get('module_name', '')}")
                    for topic in module.get("topics", []):
                        lines.append(f"\n**{topic.get('topic_name', '')}**")
                        subtopics = topic.get("subtopics", [])
                        if subtopics:
                            for sub in subtopics:
                                lines.append(f"  • {sub}")
                        summary = topic.get("summary", "")
                        if summary:
                            lines.append(f"  → {summary}")
                    lines.append("")

        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Main prompt builder
    # ------------------------------------------------------------------

    def generate_prompt(
        self,
        template_id: str,
        custom_instructions: Optional[str] = None,
    ) -> str:
        """
        Build the full generation prompt.
        Returns empty string if template not found.
        """
        info = self.get_template_info(template_id)
        if not info:
            print(f"  [PromptGenerator] Template not found: {template_id}")
            return ""

        pvq = self.get_pvq_questions(template_id)
        syllabus = self.get_syllabus(template_id)

        total_marks = info.get("total_marks", "Not specified")

        prompt = f"""# QUESTION PAPER GENERATION PROMPT

**Generated on:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## TEMPLATE INFORMATION
- **Template Name:** {info['name']}
- **Template ID:** {info['template_id']}
- **Total Marks:** {total_marks}
- **Course/Subject:** {info['name']}

---

{self._format_pvq(pvq)}

---

{self._format_syllabus(syllabus)}

---

## INSTRUCTIONS FOR QUESTION PAPER GENERATION

Based on the Previous Year Questions (PVQ) and course syllabus provided above:

1. **Question Pattern Analysis**: Analyze the patterns, question types, and difficulty levels
   from the PVQ questions listed above.

2. **Content Coverage**: Ensure the new questions cover topics and subtopics from the syllabus.
   Balance questions across all modules mentioned.

3. **Marks Distribution**: Generate questions that match the total marks of {total_marks}
   and follow the marks distribution pattern observed in PVQ (mix of short 3-4 mark
   questions and long 10-14 mark questions).

4. **Question Structure**:
   - Include a mix of question types (short answer, descriptive, numerical, analysis-based)
   - Maintain consistency with PVQ in terms of question length and complexity
   - Ensure clarity in question wording

5. **Difficulty Balance**:
   - Easy: Basic definitions and understanding
   - Medium: Application and analysis
   - Hard: Synthesis, evaluation, and multi-step problems

6. **CRITICAL — Do NOT repeat**: Every generated question must be completely new and
   original. Do not repeat, rephrase, or paraphrase any question from the PVQ list above.
"""

        if custom_instructions:
            prompt += f"\n## CUSTOM INSTRUCTIONS\n\n{custom_instructions}\n"

        prompt += f"""
---

## OUTPUT REQUIREMENTS

Generate a complete new question paper totalling exactly {total_marks} marks.
Return ONLY a valid JSON object in this exact format (no markdown, no explanation):

{{
  "questions": [
    {{
      "question_number": "1",
      "question_text": "Complete question text here",
      "marks": 5,
      "difficulty": "easy",
      "topic": "Topic name from syllabus",
      "type": "short_answer"
    }}
  ],
  "total_marks": {total_marks},
  "question_count": 0,
  "coverage": {{
    "modules_covered": [],
    "topics_covered": []
  }}
}}
"""
        print("Prompt is ",prompt)
        return prompt