from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ResumeParseRequest(BaseModel):
    raw_text: Optional[str] = None
    target_role: Optional[str] = "Senior Fullstack Engineer"
    target_company_profile: Optional[str] = None

class ParsedResumeResponse(BaseModel):
    summary: str
    extracted_skills: List[str]
    experience_years: float
    education: List[Dict[str, str]]
    work_highlights: List[str]
    ats_score: int = Field(ge=0, le=100)
    target_role_match: int = Field(ge=0, le=100)
    recommended_focus_areas: List[str]

class RAGQueryRequest(BaseModel):
    domain: str
    candidate_skills: List[str]
    difficulty: str
    target_role: Optional[str] = "Software Engineer"
    question_count: int = 3

class DynamicQuestion(BaseModel):
    question_text: str
    domain: str
    category: str
    difficulty: str
    hints: List[str]
    rubric_criteria: List[Dict[str, Any]]
    ideal_answer_outline: str

class RAGQueryResponse(BaseModel):
    questions: List[DynamicQuestion]
    context_chunks_matched: int
