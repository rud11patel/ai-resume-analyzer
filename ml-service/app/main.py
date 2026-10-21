import os
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional

from app.extractor import extract_document_text, DocumentExtractionError
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis_pipeline import run_analysis_pipeline

MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_MB", "5")) * 1024 * 1024

app = FastAPI(
    title="AI Resume Analyzer - ML & NLP Analysis Engine",
    description="Microservice for resume text extraction, semantic skill matching, and deterministic compatibility scoring.",
    version="2.0.0",
)


class ExtractionMetadata(BaseModel):
    characterCount: int
    wordCount: int
    pageCount: int
    fileType: str


class ExtractionResponse(BaseModel):
    success: bool
    text: str
    metadata: ExtractionMetadata
    warnings: List[str] = []


class ErrorResponse(BaseModel):
    success: bool = False
    error: str


@app.get("/")
def read_root():
    return {
        "service": "AI Resume Analyzer - ML & NLP Analysis Engine",
        "status": "operational",
        "phase": "Phase 4: AI & NLP Analysis Engine",
        "version": "2.0.0",
        "docs_url": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "ml-service",
        "version": "2.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "capabilities": [
            "pdf-extraction",
            "docx-extraction",
            "nlp-analysis",
            "skill-normalization",
            "semantic-matching",
            "compatibility-scoring",
        ],
    }


@app.post(
    "/extract-text",
    response_model=ExtractionResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid file format, corrupt document, or empty input"},
        413: {"model": ErrorResponse, "description": "File exceeds allowable size limit"},
        422: {"model": ErrorResponse, "description": "Encrypted or unprocessable document"},
    },
)
async def extract_text(file: UploadFile = File(...)):
    """
    Accepts a PDF or DOCX resume document as multipart/form-data.
    Extracts plain text and page metadata safely, returning clean structured JSON.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename must be provided with the upload.",
        )

    filename_lower = file.filename.lower()
    if not (filename_lower.endswith(".pdf") or filename_lower.endswith(".docx")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.filename}'. Only .pdf and .docx are supported.",
        )

    # Read byte payload into memory
    content = await file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty (0 bytes).",
        )

    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size / (1024 * 1024):.2f}MB) exceeds the maximum allowed limit of {MAX_FILE_SIZE_BYTES / (1024 * 1024):.0f}MB.",
        )

    try:
        result = extract_document_text(file.filename, content)
        return result
    except DocumentExtractionError as err:
        raise HTTPException(status_code=err.status_code, detail=err.message)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal document extraction error: {str(exc)}",
        )


@app.post(
    "/analyze",
    response_model=AnalysisResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid or missing resume text or job description"},
        500: {"model": ErrorResponse, "description": "Internal analysis error"},
    },
)
async def analyze_resume_endpoint(request: AnalysisRequest):
    """
    Analyzes resume text against a target job description.
    Executes skill extraction, normalization, hybrid semantic matching,
    deterministic scoring, keyword analysis, and recommendation generation.
    """
    if not request.resume_text or len(request.resume_text.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume text must not be empty.",
        )

    if not request.job_description or len(request.job_description.strip()) < 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description must be provided and contain at least 15 characters.",
        )

    try:
        response = run_analysis_pipeline(request)
        return response
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis engine failed: {str(exc)}",
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.detail},
    )
