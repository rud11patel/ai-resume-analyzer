# System Architecture — AI Resume Analyzer

## 1. High-Level Architecture Overview

The **AI Resume Analyzer** is architected as a modular, decoupled full-stack platform designed for scalability, security, and clean separation of concerns.

```
+-------------------------------------------------------------------------+
|                           User Browser / Client                         |
|                           (React 19 + Vite SPA)                         |
|                           Port: 5173                                    |
+-------------------------------------------------------------------------+
                                    |
                                    | HTTPS / REST (JSON)
                                    | CORS Protected
                                    v
+-------------------------------------------------------------------------+
|                           Backend API Gateway                           |
|                       (Node.js + Express.js Engine)                     |
|                           Port: 5000                                    |
+-------------------------------------------------------------------------+
                  |                                     |
                  | Mongoose ODM                        | REST / HTTP (Internal)
                  | Port: 27017                         | Port: 8000
                  v                                     v
+------------------------------------+   +--------------------------------+
|          Database Layer            |   |       AI / NLP Microservice    |
|   (MongoDB Local / Atlas Cluster)  |   |        (FastAPI + Python)      |
|                                    |   |       (Phase 4/5 Engine)       |
+------------------------------------+   +--------------------------------+
```

---

## 2. Component Responsibilities

### A. Frontend Client (React 19 + Vite + Tailwind CSS)
- **Role**: User Interface and presentation tier.
- **Responsibilities**:
  - Drag-and-drop file upload handling for resume documents (PDF, DOCX).
  - Target job description text entry and profile management.
  - Interactive visualization of compatibility scores, skill breakdown graphs, and actionable recommendations.
  - Client-side validation, responsiveness, and state management.
  - Consumes the Express backend via REST API using configurable `VITE_API_BASE_URL`.

### B. Backend API Service (Node.js + Express.js)
- **Role**: Application orchestration, business logic, security, and persistence gateway.
- **Responsibilities**:
  - Request authentication, authorization, session management, and rate limiting.
  - Centralized error handling, input validation, and sanitization.
  - Document ingestion, storage handling, and dispatching text payloads to the AI microservice.
  - Persistence and query handling with MongoDB via Mongoose.
  - Real-time service health aggregation (`GET /api/health`).

### C. Database Layer (MongoDB + Mongoose)
- **Role**: Document persistence and relational linking.
- **Responsibilities**:
  - Storing user accounts, uploaded resume metadata and parsed content.
  - Storing job descriptions and structured requirement lists.
  - Storing AI analysis results, historical comparisons, and metrics.
  - Flexible document schemas allowing evolution of parsed resume attributes.

### D. AI / NLP Microservice (Python + FastAPI — Phase 4/5)
- **Role**: High-performance semantic analysis and natural language processing.
- **Responsibilities**:
  - Extracting raw text from PDFs and DOCX files.
  - Semantic vector embedding generation (e.g., SentenceTransformers / OpenAI embeddings).
  - Cosine similarity and keyword matching between resume experience and job requirements.
  - LLM-powered resume critique, missing skills identification, and bullet point improvement generation.

---

## 3. Communication Boundaries & Security

1. **Client to Backend**:
   - All browser requests target `/api/*` on the Express backend.
   - Cross-Origin Resource Sharing (CORS) is restricted to the specific `CLIENT_URL` origin.
   - Body size limits (`REQUEST_LIMIT=10mb`) protect against denial-of-service payload attacks.
   - Security headers enforced via `helmet`.

2. **Backend to Database**:
   - Express connects to MongoDB via Mongoose connection pooling.
   - Credentials in `MONGODB_URI` are never logged or exposed in client responses.
   - Connection failure triggers degraded mode rather than process termination, reporting clear health states.

3. **Backend to AI Microservice**:
   - Express will communicate with FastAPI over an isolated internal network (`PYTHON_SERVICE_URL`).
   - The Python service will not be directly exposed to public client browsers.

---

## 4. Planned Data Models (Phase 3 Blueprints)

### User
- `_id`: ObjectId
- `email`: String (unique, index)
- `passwordHash`: String
- `fullName`: String
- `role`: Enum (`'user'`, `'admin'`)
- `createdAt`: Date

### Resume
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, index)
- `title`: String
- `fileName`: String
- `fileUrl`: String
- `rawText`: String
- `parsedData`:
  - `skills`: Array[String]
  - `experienceYears`: Number
  - `education`: Array[Object]
  - `workExperience`: Array[Object]
- `createdAt`: Date

### JobDescription
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, index)
- `title`: String
- `company`: String
- `rawText`: String
- `parsedRequirements`:
  - `requiredSkills`: Array[String]
  - `optionalSkills`: Array[String]
  - `experienceRequiredYears`: Number
- `createdAt`: Date

### AnalysisResult
- `_id`: ObjectId
- `userId`: ObjectId (ref: User, index)
- `resumeId`: ObjectId (ref: Resume, index)
- `jobDescriptionId`: ObjectId (ref: JobDescription, index)
- `compatibilityScore`: Number (0-100)
- `matchedSkills`: Array[String]
- `missingSkills`: Array[String]
- `suggestedImprovements`: Array[Object]
- `aiSummary`: String
- `processingTimeMs`: Number
- `createdAt`: Date
