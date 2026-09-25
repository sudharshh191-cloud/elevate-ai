from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uvicorn
from app.schemas import (
    ResumeParseRequest,
    ParsedResumeResponse,
    RAGQueryRequest,
    RAGQueryResponse
)
from app.resume_parser import ResumeParser
from app.rag_engine import RAGEngine

app = FastAPI(
    title="AI Interview NLP & RAG Microservice",
    description="Microservice for Resume Parsing, Entity Extraction, ATS Scoring, and Contextual Question RAG",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Python NLP & RAG Microservice",
        "version": "1.0.0"
    }

@app.post("/parse-resume", response_model=ParsedResumeResponse)
async def parse_resume_text(payload: ResumeParseRequest):
    if not payload.raw_text or len(payload.raw_text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Resume text is required for parsing.")

    text = payload.raw_text.strip()
    skills = ResumeParser.extract_skills_from_text(text)
    years = ResumeParser.estimate_experience_years(text)
    alignment = ResumeParser.calculate_ats_and_alignment(skills, payload.target_role or "Senior Fullstack Engineer", text)
    education = ResumeParser.extract_education(text)
    highlights = ResumeParser.extract_work_highlights(text)

    summary = f"Software engineering professional with expertise in {', '.join(skills[:5]) if skills else 'modern software engineering'}."

    return ParsedResumeResponse(
        summary=summary,
        extracted_skills=skills,
        experience_years=years,
        education=education,
        work_highlights=highlights,
        ats_score=alignment["ats_score"],
        target_role_match=alignment["target_role_match"],
        recommended_focus_areas=alignment["recommended_focus_areas"]
    )

@app.post("/parse-resume-file", response_model=ParsedResumeResponse)
async def parse_resume_file(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form("Senior Fullstack Engineer")
):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")

    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    # Max 10MB file limit
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum 10MB limit.")

    filename_lower = file.filename.lower()
    extracted_text = ""

    try:
        if filename_lower.endswith(".pdf"):
            extracted_text = ResumeParser.extract_text_from_pdf_bytes(content)
        elif filename_lower.endswith(".docx"):
            extracted_text = ResumeParser.extract_text_from_docx_bytes(content)
        elif filename_lower.endswith((".txt", ".md")):
            extracted_text = content.decode("utf-8", errors="ignore").strip()
            if not extracted_text:
                raise ValueError("Text file contains no extractable content.")
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format '{file.filename}'. Please upload a PDF, DOCX, or TXT resume."
            )
    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text from '{file.filename}': {str(e)}")

    if not extracted_text or len(extracted_text.strip()) == 0:
        raise HTTPException(
            status_code=400,
            detail="Could not extract readable text from the uploaded file. Please ensure it is not an image scan or corrupted document."
        )

    # NLP Analysis
    skills = ResumeParser.extract_skills_from_text(extracted_text)
    years = ResumeParser.estimate_experience_years(extracted_text)
    alignment = ResumeParser.calculate_ats_and_alignment(skills, target_role or "Senior Fullstack Engineer", extracted_text)
    education = ResumeParser.extract_education(extracted_text)
    highlights = ResumeParser.extract_work_highlights(extracted_text)

    summary = f"Demonstrated engineering track record with verified experience in {', '.join(skills[:5]) if skills else 'software development'}."

    return ParsedResumeResponse(
        summary=summary,
        extracted_skills=skills,
        experience_years=years,
        education=education,
        work_highlights=highlights,
        ats_score=alignment["ats_score"],
        target_role_match=alignment["target_role_match"],
        recommended_focus_areas=alignment["recommended_focus_areas"]
    )

@app.post("/rag-questions", response_model=RAGQueryResponse)
def get_rag_questions(payload: RAGQueryRequest):
    questions = RAGEngine.generate_contextual_questions(
        domain=payload.domain,
        candidate_skills=payload.candidate_skills,
        difficulty=payload.difficulty,
        count=payload.question_count
    )
    return RAGQueryResponse(
        questions=questions,
        context_chunks_matched=len(payload.candidate_skills)
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
