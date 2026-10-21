# AI Resume Analyzer — Monorepo

An intelligent, production-ready full-stack application that extracts text from resumes, parses job descriptions, computes deterministic compatibility scores, surfaces missing skills across 4 alignment tiers, and delivers AI-guided improvement recommendations.

---

## 1. Project Overview & Progress

The **AI Resume Analyzer** provides job candidates with empirical, transparent, and explainable semantic analysis of their resumes against target job postings.

### Project Roadmap & Milestones

1. **Phase 1: Foundation & Project Setup** ✅ *Complete*
   - Monorepo architecture, Express REST API gateway, MongoDB Mongoose connector, FastAPI microservice scaffold, health telemetry.
2. **Phase 2: Frontend & User Interface** ✅ *Complete*
   - Modern React 19 + Vite + Tailwind CSS v4 single-page application with responsive layouts.
   - Landing page, Dashboard, Analysis interface, Results report, History, Settings, and Auth screens.
3. **Phase 3: Backend, Database & Resume Processing** ✅ *Complete*
   - Mongoose data models (`User`, `Resume`, `JobDescription`, `AnalysisResult`).
   - Secure authentication with bcrypt password hashing and JWT (HTTP-only cookies & Bearer tokens).
   - Secure resume document upload (PDF & DOCX, 5MB limit, UUID disk storage).
   - Python document processing pipeline via PyMuPDF and python-docx with structured JSON extraction.
4. **Phase 4: AI & NLP Analysis Engine** ✅ *Complete*
   - Modular NLP services: section segmentation, taxonomy normalization, and skill extraction with evidence excerpts.
   - Deterministic Job Description parsing (title, required vs preferred skills, years of experience, qualifications).
   - Hybrid semantic matching engine (exact match, alias mapping, ecosystem relationships, TF-IDF n-gram cosine similarity).
   - Deterministic 0–100 compatibility scoring algorithm with explicit, documented component weights ($0.40 \cdot \text{Req} + 0.15 \cdot \text{Pref} + 0.20 \cdot \text{Exp} + 0.15 \cdot \text{KW} + 0.10 \cdot \text{ATS}$).
   - Actionable recommendations, ATS document audits, and bullet point transformations with candidate-supplied metric placeholders.
5. **Phase 5: Integration, Testing & Refinement** ✅ *Complete*
   - Full integration connecting frontend, Express backend, MongoDB, and Python FastAPI microservice.
   - Protected routes and live session verification against `/api/auth/me`.
   - Dual-mode Resume management (upload new PDF/DOCX or select existing from library).
   - Dual-mode Job Description management (paste new posting or select from saved library).
   - Elimination of silent mock fallbacks: backend errors surface cleanly to user interface.
   - Support for all 4 skill tiers: Matched, Partially Matched, Missing, and Uncertain evidence.
   - In-memory rate limiting on sensitive routes (`/api/auth`, `/api/resumes`, `/api/analyses`).
   - Comprehensive test suites: 34 backend unit & E2E integration tests, 26 Python NLP tests.

---

## 2. Technology Stack

| Layer | Technology | Version / Details |
| :--- | :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS | React 19, Vite 6, Tailwind CSS v4, Lucide Icons, React Router v7 |
| **Backend Gateway** | Node.js, Express.js | Express 4, Mongoose 8, Multer 2, JWT, Bcryptjs, Cookie-Parser, Helmet, CORS |
| **Database** | MongoDB | Mongoose ODM (supports Local MongoDB and MongoDB Atlas) |
| **Document Processing & AI** | Python, FastAPI, scikit-learn | Python 3.11+, FastAPI, PyMuPDF (fitz), python-docx, scikit-learn (TF-IDF), Uvicorn |
| **Testing** | Node Test Runner, Pytest | Native `node:test` runner + Supertest assertions, Pytest + TestClient |

---

## 3. End-to-End Application Architecture

```
                  ┌─────────────────────────────────────────┐
                  │          React 19 Frontend SPA          │
                  │   (Vite 6, Tailwind CSS v4, Port 5173)   │
                  └────────────────────┬────────────────────┘
                                       │ HTTP / Bearer / Cookies
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │       Node.js Express API Gateway       │
                  │              (Port 5000)                │
                  │  - Auth (JWT + bcrypt)                  │
                  │  - Rate Limiting & Helmet Headers       │
                  │  - Multer File Upload & Storage         │
                  │  - Orchestration & Error Sanitization   │
                  └────────────┬──────────────────┬─────────┘
                               │                  │
         Mongoose (Port 27017) │                  │ Internal HTTP (Port 8000)
                               ▼                  ▼
                  ┌───────────────────────┐  ┌──────────────────────────────────┐
                  │   MongoDB Database    │  │     Python FastAPI ML Service    │
                  │  - users              │  │  - PyMuPDF & python-docx Parser  │
                  │  - resumes            │  │  - Section Segmentation         │
                  │  - jobdescriptions    │  │  - Skill Normalization & Aliases │
                  │  - analysisresults    │  │  - TF-IDF Cosine Semantic Match  │
                  └───────────────────────┘  │  - Deterministic 0-100 Scoring   │
                                             │  - Recommendations & ATS Checks  │
                                             └──────────────────────────────────┘
```

---

## 4. Prerequisites

Ensure the following runtimes are installed on your workstation:
- **Node.js**: `v20.0.0` or higher (verified with Node `v22.19.0`)
- **npm**: `v10.0.0` or higher
- **Python**: `3.11` or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` OR a MongoDB Atlas cluster URI

---

## 5. Local Setup & Installation

### A. Backend Gateway Setup
In Windows PowerShell:
```powershell
cd server
npm install
Copy-Item .env.example .env
```

### B. Frontend Client Setup
```powershell
cd ..\client
npm install
Copy-Item .env.example .env
```

### C. Python AI / NLP Microservice Setup
```powershell
cd ..\ml-service
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

---

## 6. Environment Configuration

### Backend (`server/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port on which the Express server listens |
| `NODE_ENV` | `development` | Environment mode (`development`, `production`, `test`) |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/ai_resume_analyzer` | MongoDB connection string |
| `CLIENT_URL` | `http://localhost:5173` | Allowed origin for CORS whitelist |
| `JWT_SECRET` | `super-secret-jwt-key-replace-in-production` | Secret key for signing authentication tokens |
| `JWT_EXPIRES_IN` | `7d` | Token expiration lifespan |
| `UPLOAD_DIR` | `./uploads` | Filesystem storage path for uploaded documents |
| `MAX_FILE_SIZE_MB` | `5` | Maximum upload size in megabytes |
| `PYTHON_SERVICE_URL` | `http://127.0.0.1:8000` | Internal URL of Python NLP microservice |
| `REQUEST_LIMIT` | `10mb` | Maximum JSON request body payload size |

### Python Microservice (`ml-service/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `HOST` | `127.0.0.1` | Bind host address |
| `PORT` | `8000` | Port for FastAPI service |
| `ENVIRONMENT` | `development` | Execution environment |
| `MAX_FILE_SIZE_MB` | `5` | Maximum document processing limit |

### Frontend (`client/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL of backend Express API |

---

## 7. Starting the Services Locally (Windows)

Open three separate PowerShell terminal windows:

### Terminal 1: Python ML & NLP Analysis Engine
```powershell
cd ml-service
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# Running on http://127.0.0.1:8000 (Swagger docs: http://127.0.0.1:8000/docs)
```

### Terminal 2: Node.js Express Gateway
```powershell
cd server
npm run dev
# Running on http://localhost:5000
```

### Terminal 3: React Frontend Client
```powershell
cd client
npm run dev
# Running on http://localhost:5173
```

---

## 8. API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new candidate account.
- `POST /api/auth/login`: Authenticate and receive JWT cookie & Bearer token.
- `POST /api/auth/logout`: Invalidate session and clear auth cookie.
- `GET /api/auth/me`: Get current authenticated user profile.

### Resume Management (`/api/resumes`)
- `POST /api/resumes`: Upload PDF or DOCX file (up to 5MB), extract text via Python, store metadata.
- `GET /api/resumes`: List all resumes owned by authenticated user (lightweight, excludes raw text).
- `GET /api/resumes/:id`: Retrieve single resume details with extracted text.
- `DELETE /api/resumes/:id`: Delete resume document, physical file, and associated analysis records.

### Job Description Management (`/api/job-descriptions`)
- `POST /api/job-descriptions`: Save target job description.
- `GET /api/job-descriptions`: List saved job descriptions for authenticated user.
- `GET /api/job-descriptions/:id`: Retrieve single job description.
- `DELETE /api/job-descriptions/:id`: Delete job description and associated analysis records.

### Analysis & Compatibility Engine (`/api/analyses`)
- `POST /api/analyses`: Trigger AI compatibility analysis (`{ resumeId, jobDescriptionId }`).
- `GET /api/analyses`: List user's historical evaluations with summary statistics.
- `GET /api/analyses/:id`: Retrieve full multi-dimensional evaluation report.
- `DELETE /api/analyses/:id`: Remove analysis record.

### Internal Python Endpoints (`http://127.0.0.1:8000`)
- `POST /extract`: Multipart file text extraction from PDF and DOCX.
- `POST /analyze`: NLP analysis pipeline returning compatibility scores, skill breakdown, and recommendations.
- `GET /health`: Health and telemetry endpoint.

---

## 9. Running Automated Tests

### A. Backend Unit & E2E Integration Tests (Node.js)
```powershell
cd server
npm test
```
**Results**: 34 tests passing across 8 suites:
- User registration, password hashing, and login authentication.
- Resource isolation and cross-tenant security verification.
- Document upload validation, MIME checking, and safe disk cleanup.
- Complete 11-step End-to-End user workflow (`integration.e2e.test.js`).
- Rate limiting middleware resilience.
- Python microservice failure handling and graceful 503 recovery.

### B. NLP & ML Test Suite (Python)
```powershell
cd ml-service
.\venv\Scripts\Activate.ps1
pytest -q
```
**Results**: 26 tests passing across 6 test modules:
- Document text extraction for PDF and DOCX documents.
- Skill normalization, taxonomy mapping, and alias resolution.
- Deterministic compatibility scoring across strong, weak, and edge-case inputs.
- Hybrid TF-IDF n-gram cosine similarity matching.
- Recommendation synthesis and ATS check validation.
- Input validation and insufficient-data detection.

### C. Frontend Production Build Validation
```powershell
cd client
npm run build
```
**Results**: Clean Vite build, 0 compilation errors.

---

## 10. Document Processing & File Limits

- **Supported File Types**: Standard Adobe PDF (`.pdf`) and Microsoft Word (`.docx`).
- **Maximum File Size**: 5 MB per document.
- **Scanned / Image-Only PDFs**: The system checks extracted word count. Resumes with $<20$ words are flagged as `insufficient_data` or scanned image files, returning transparent diagnostic guidance rather than fabricated match scores.
- **Security**: Uploaded files receive a cryptographically random UUID filename (`resume-<uuid>.<ext>`) to completely prevent path traversal attacks.

---

## 11. Troubleshooting & Diagnostics

- **MongoDB connection refused (`ECONNREFUSED 127.0.0.1:27017`)**:
  Verify local MongoDB service is running via `Get-Service MongoDB` or start it with `net start MongoDB`.
- **Python ML service unreachable (`503 Service Unavailable`)**:
  Ensure Uvicorn is running in `ml-service` on port 8000. The backend dynamically falls back to safe failure reporting with structured error diagnostics.
- **Rate limiting errors (`429 Too Many Requests`)**:
  Auth routes permit 20 requests per 15 minutes; upload and analysis routes permit 30 requests per minute per IP. Wait for the `Retry-After` window or test in `NODE_ENV=test`.
