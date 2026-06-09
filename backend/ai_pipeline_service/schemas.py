from pydantic import BaseModel, Field
from typing import List

class Topic(BaseModel):
    topic_name: str = Field(description="Name of the topic")
    subtopics: List[str] = Field(description="List of subtopics under this topic")
    summary: str = Field(description="Concise summary of the topic")

class Module(BaseModel):
    module_name: str = Field(description="Name of the module (e.g., Module 1, Module 3)")
    topics: List[Topic] = Field(description="List of topics in this module")

class Course(BaseModel):
    course_code: str = Field(description="Course code (e.g., HUT 300)")
    course_name: str = Field(description="Full name of the course")
    modules: List[Module] = Field(description="List of modules in the course")

class ProcessedResult(BaseModel):
    courses: List[Course] = Field(description="List of courses extracted from the PDF")
