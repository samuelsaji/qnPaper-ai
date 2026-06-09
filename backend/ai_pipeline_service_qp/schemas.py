from pydantic import BaseModel, Field
from typing import List

class Question(BaseModel):
    """Individual question extracted from PDF"""
    question_number: str = Field(description="Question number (e.g., '1', '2a', '3b')")
    question_text: str = Field(description="Complete question text")
    marks: int = Field(description="Marks for this question")

class ProcessedQuestionPaper(BaseModel):
    """Array of extracted questions"""
    questions: List[Question] = Field(description="List of extracted questions")

