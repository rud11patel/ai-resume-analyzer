# AI Resume Analyzer — ML & NLP Microservice

This microservice provides document text extraction (PDF & DOCX), natural language processing (NLP), taxonomy skill normalization, hybrid semantic similarity matching, and deterministic resume-to-job compatibility scoring.

---

## Architecture & Framework Choice: FastAPI

We selected **FastAPI** as the web framework for this microservice for:
1. **Asynchronous Throughput**: Native `async`/`await` support ensures high concurrency when processing heavy ML inference pipelines without blocking HTTP worker threads.
2. **Automated API Documentation**: Automatically generates interactive OpenAPI / Swagger specifications at `/docs` and ReDoc at `/redoc`.
3. **Pydantic Data Validation**: Strict type hints and request validation, critical for validating structured resume extractions and scoring payloads.
4. **Lightweight & Modular**: Minimal overhead compared to full-stack frameworks like Django, keeping container footprints small.

---

## Directory Structure (Phase 4)

```
ml-service/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application & endpoints (/extract-text, /analyze, /health)
│   ├── extractor.py                # PDF (PyMuPDF) and DOCX (python-docx) extraction
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py               # Weights, thresholds, and engine settings
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── analysis.py             # Pydantic request/response models
│   └── services/
│       ├── __init__.py
│       ├── text_preprocessing.py   # Text cleaning, section segmentation, ATS structural audit
│       ├── skill_normalization.py  # Taxonomy, alias resolution, canonical mapping
│       ├── skill_extraction.py     # Resume information & skill extraction with evidence
│       ├── job_description_parser.py # Deterministic JD parser (title, req vs pref, exp, degrees)
│       ├── semantic_matching.py    # Hybrid matcher (exact, alias, domain graph, TF-IDF n-grams)
│       ├── scoring.py              # Deterministic scoring algorithm & subscores
│       ├── recommendation_engine.py# Actionable recommendations, bullet point rewriter, ATS checks
│       └── analysis_pipeline.py    # End-to-end analysis orchestration
├── tests/
│   ├── __init__.py
│   ├── test_health.py              # Health endpoint test suite
│   ├── test_extraction.py          # PDF and DOCX extraction test suite
│   ├── test_skill_normalization.py # Skill normalization and alias resolution tests
│   ├── test_matching_and_scoring.py# Skill matching, scoring weights, bounds, and tiers tests
│   ├── test_recommendations.py     # Recommendation and bullet improvement tests
│   └── test_analyze_api.py         # POST /analyze endpoint and error validation tests
├── pytest.ini                      # Pytest pythonpath configuration
├── .env.example                    # Environment template
├── requirements.txt                # Python dependencies
└── README.md
```

---

## Scoring Formula & Weights

The compatibility score is deterministic, explainable, and strictly bounded between 0 and 100:

$$\text{OverallScore} = 0.40 \cdot S_{\text{req}} + 0.15 \cdot S_{\text{pref}} + 0.20 \cdot S_{\text{exp}} + 0.15 \cdot S_{\text{kw}} + 0.10 \cdot S_{\text{ats}}$$

### Weight Rationale:
- **Required Skills ($S_{\text{req}}$, 40%)**: Core technical qualifications are the primary hiring filter. Partial matches receive 50% credit; missing required skills significantly lower the score.
- **Preferred Skills ($S_{\text{pref}}$, 15%)**: Bonus/optional qualifications differentiate candidates without disqualifying them.
- **Experience Relevance ($S_{\text{exp}}$, 20%)**: Career tenure and project accomplishments validate practical depth.
- **Keyword Density ($S_{\text{kw}}$, 15%)**: Technical vocabulary alignment ensures ATS searchability.
- **ATS Formatting ($S_{\text{ats}}$, 10%)**: Document layout, contact information, and standard section headings.

---

## Model & Dependency Choices

- **TF-IDF & Character N-Grams (`scikit-learn`)**:
  - Sub-word character n-gram cosine similarity (3-to-5 grams) handles typos, hyphenation variations, and technical phrasing without requiring GPU resources or multi-gigabyte downloads.
  - Runs in sub-50ms CPU execution time on standard developer machines.
- **PyMuPDF (`fitz`) & `python-docx`**:
  - High-fidelity text extraction with font encoding preservation and table traversal.

---

## Setup & Running (Windows PowerShell)

### 1. Activate Virtual Environment
```powershell
cd ml-service
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 3. Run the Microservice
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Run Automated Tests
```powershell
pytest
```
