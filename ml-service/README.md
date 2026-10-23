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

The compatibility score is deterministic, evidence-based, explainable, and strictly bounded between 0 and 100:

$$\text{OverallScore} = w_{\text{req}} \cdot S_{\text{req}} + w_{\text{exp}} \cdot S_{\text{exp}} + w_{\text{edu}} \cdot S_{\text{edu}} + w_{\text{pref}} \cdot S_{\text{pref}} + w_{\text{role}} \cdot S_{\text{role}}$$

### Baseline Weight Model:
- **Required Skills ($S_{\text{req}}$, 50%)**: Non-negotiable technical requirements are the primary filter. Missing mandatory skills heavily penalize the score; zero matched required skills triggers an explainable cap (15%).
- **Experience & Project Relevance ($S_{\text{exp}}$, 25%)**: Relevance-aware evaluation combining career tenure against seniority targets (65%) and verified project technological overlap (35%). No unconditional project-count bonuses.
- **Education & Eligibility ($S_{\text{edu}}$, 10%)**: Degree level and baseline academic qualifications.
- **Preferred Skills ($S_{\text{pref}}$, 10%)**: Secondary bonus qualifications.
- **Role-Specific Alignment ($S_{\text{role}}$, 5%)**: Distinct domain concepts and engineering practices without double-counting technical skills.
- **ATS Formatting ($S_{\text{ats}}$, Independent)**: Formatting, layout hygiene, and contact info are evaluated separately and excluded from the job compatibility score so layout quality does not falsely inflate candidate suitability.

### Proportional Normalization Policy:
When a dimension is not applicable (e.g., the job description specifies no preferred qualifications), its weight is set to $0.0$ and the remaining active base weights are scaled proportionally so their sum is strictly $1.00$ (100%). No arbitrary free points (e.g. 80/100 default) are awarded.

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
