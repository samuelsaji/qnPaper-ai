from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TemplateCreate(BaseModel):
    user_id: str
    name: str
    total_marks: int
    pdf_files: List[str]

class TemplateResponse(BaseModel):
    id: str
    user_id: str
    name: str
    total_marks: int
    pdf_files: List[str]
