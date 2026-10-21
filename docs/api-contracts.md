# API Contracts & Endpoint Specifications

This document outlines the API specifications, request formats, and response schemas for all active services in the **AI Resume Analyzer** application.

---

## 1. Backend Express API

Base URL: `http://localhost:5000/api` (or configured `PORT`)

### Authentication & Authorization

All protected routes accept either:
1. An `Authorization: Bearer <token>` HTTP header, or
2. An HTTP-only secure cookie named `token`.

#### `POST /api/auth/register`
Register a new candidate profile.
- **Request Body**:
  ```json
  {
    "name": "Alex Morgan",
    "email": "alex.morgan@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Status: 201 Created**:
  ```json
  {
    "success": true,
    "message": "Account registered successfully.",
    "data": {
      "user": {
        "_id": "670cfa5e2a3b...",
        "name": "Alex Morgan",
        "email": "alex.morgan@example.com",
        "role": "user",
        "createdAt": "2026-10-14T10:00:00.000Z",
        "updatedAt": "2026-10-14T10:00:00.000Z"
      },
      "token": "eyJhbGciOi..."
    }
  }
  ```
- **Status: 409 Conflict**: Returned when email is already registered.

#### `POST /api/auth/login`
Sign in with existing credentials.
- **Request Body**:
  ```json
  {
    "email": "alex.morgan@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Status: 200 OK**: Returns user object, token, and sets HTTP-only cookie.
- **Status: 401 Unauthorized**: Returned on incorrect password or unknown email.

#### `POST /api/auth/logout`
Terminates session and clears the HTTP-only auth cookie.
- **Status: 200 OK**

#### `GET /api/auth/me` *(Protected)*
Retrieves current authenticated candidate profile.
- **Status: 200 OK**

---

### Resume Document Management

#### `POST /api/resumes` *(Protected)*
Upload and extract plain text from a resume document.
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `file` (Binary PDF or DOCX file, max 5 MB).
- **Status: 201 Created**:
  ```json
  {
    "success": true,
    "message": "Resume uploaded and text extracted successfully.",
    "data": {
      "resume": {
        "_id": "670cfe890...",
        "userId": "670cfa5e2a3b...",
        "originalName": "Alex_Morgan_Resume.pdf",
        "fileName": "resume-89b2c3d4-e5f6-47a8-9b0c-1d2e3f4a5b6c.pdf",
        "fileType": "application/pdf",
        "fileSize": 142850,
        "extractedText": "Alex Morgan\nSenior Frontend Engineer...",
        "extractionStatus": "completed",
        "extractionError": null,
        "metadata": {
          "characterCount": 4250,
          "wordCount": 610,
          "pageCount": 2,
          "fileType": "pdf",
          "warnings": []
        },
        "createdAt": "2026-10-14T10:05:00.000Z"
      }
    }
  }
  ```
- **Status: 400 Bad Request**: Invalid format (not `.pdf` or `.docx`).
- **Status: 413 Payload Too Large**: File exceeds 5 MB.

#### `GET /api/resumes` *(Protected)*
List all uploaded resumes owned by the current user.
- **Status: 200 OK**:
  ```json
  {
    "success": true,
    "data": {
      "resumes": [
        {
          "_id": "670cfe890...",
          "originalName": "Alex_Morgan_Resume.pdf",
          "fileName": "resume-89b2c3d4...",
          "fileType": "application/pdf",
          "fileSize": 142850,
          "extractionStatus": "completed",
          "createdAt": "2026-10-14T10:05:00.000Z"
        }
      ],
      "count": 1
    }
  }
  ```

#### `GET /api/resumes/:id` *(Protected)*
Retrieve a single resume document's metadata and extracted text.
- **Status: 200 OK**
- **Status: 404 Not Found**: If resume does not exist or belongs to another user.

#### `DELETE /api/resumes/:id` *(Protected)*
Deletes the resume document from MongoDB and unlinks the file from disk storage.
- **Status: 200 OK**

---

### Job Descriptions

#### `POST /api/job-descriptions` *(Protected)*
Save a target job posting.
- **Request Body**:
  ```json
  {
    "roleTitle": "Senior Frontend Engineer",
    "company": "Stripe",
    "rawText": "We are seeking a Senior Frontend Engineer proficient in React, TypeScript, and modern component systems..."
  }
  ```
- **Status: 201 Created**

#### `GET /api/job-descriptions` *(Protected)*
List all job descriptions for current user.
- **Status: 200 OK**

#### `GET /api/job-descriptions/:id` *(Protected)*
Retrieve a single job description.
- **Status: 200 OK**

#### `DELETE /api/job-descriptions/:id` *(Protected)*
Delete an owned job description.
- **Status: 200 OK**

---

### Analysis Records

#### `GET /api/analyses` *(Protected)*
List all saved analysis records for current user with populated resume and role details.
- **Status: 200 OK**

#### `GET /api/analyses/:id` *(Protected)*
Retrieve full details of an analysis evaluation.
- **Status: 200 OK**

#### `POST /api/analyses` *(Protected)*
Dispatches an existing extracted resume and target job description to the Python NLP engine for full deterministic compatibility scoring, skill matching, keyword density analysis, and bullet point improvement generation.

- **Request Body**:
  ```json
  {
    "resumeId": "670cfe890a1b2c3d4e5f6789",
    "jobDescriptionId": "670cff120a1b2c3d4e5f678a"
  }
  ```
- **Status: 201 Created**:
  ```json
  {
    "success": true,
    "message": "Resume analyzed successfully.",
    "data": {
      "analysis": {
        "_id": "670d01230a1b2c3d4e5f678b",
        "userId": "670cfa5e2a3b...",
        "resumeId": "670cfe890...",
        "jobDescriptionId": "670cff120...",
        "status": "completed",
        "overallScore": 84,
        "scoreLabel": "Strong Match",
        "isDemoData": false,
        "scoreBreakdown": {
          "calculationFormula": "OverallScore = 0.40 * ReqSkills + 0.15 * PrefSkills + 0.20 * Experience + 0.15 * Keywords + 0.10 * Formatting",
          "components": [
            {
              "name": "Required Qualifications Coverage",
              "weight": 0.4,
              "rawScore": 88,
              "weightedScore": 35.2,
              "explanation": "Matched 4 mandatory skills with 1 partial match out of 5 required."
            }
          ]
        },
        "structuredOutput": { ... },
        "completedAt": "2026-10-15T10:30:00.000Z"
      }
    }
  }
  ```
- **Status: 400 Bad Request**: Missing identifiers, unextracted resume text, or unparseable inputs.
- **Status: 404 Not Found**: Resume or job description not found or belongs to another user.
- **Status: 503 Service Unavailable**: Python AI analysis microservice offline or unreachable.

#### `DELETE /api/analyses/:id` *(Protected)*
Delete an analysis record.
- **Status: 200 OK**

---

### Health & Monitoring

#### `GET /api/health`
Retrieves service uptime, environment, and sub-service connection statuses.
- **Status: 200 OK** (Operational or Degraded)

---

## 2. Python ML & NLP Analysis Microservice

Base URL: `http://localhost:8000`

### `POST /analyze`
Analyzes candidate resume plain text against a target job description using hybrid skill extraction, taxonomy normalization, domain relationship mapping, and TF-IDF semantic similarity.

- **Request Body (`application/json`)**:
  ```json
  {
    "resume_text": "Alex Morgan\nalex@example.com...\nTECHNICAL SKILLS\nReact, TypeScript, Python...",
    "job_description": "Job Title: Senior Frontend Engineer\nRequirements: 4+ years experience, React, TypeScript...",
    "role_title": "Senior Frontend Engineer",
    "company": "Stripe"
  }
  ```
- **Status: 200 OK**:
  ```json
  {
    "status": "completed",
    "overallScore": 84,
    "scoreLabel": "Strong Match",
    "subScores": {
      "technicalSkills": 88,
      "experienceRelevance": 82,
      "atsFormatting": 92,
      "keywordDensity": 74
    },
    "scoreBreakdown": {
      "calculationFormula": "OverallScore = 0.40 * ReqSkills + 0.15 * PrefSkills + 0.20 * Experience + 0.15 * Keywords + 0.10 * Formatting",
      "components": [ ... ]
    },
    "skillMatchSummary": {
      "totalIdentified": 18,
      "matchedCount": 15,
      "missingCount": 3,
      "percentage": 83
    },
    "matchedSkills": [
      { "name": "React", "category": "Frontend", "level": "Expert", "confidence": 96, "evidence": "Architected reusable React components..." }
    ],
    "partiallyMatchedSkills": [
      { "name": "GraphQL", "category": "Backend", "matchBasis": "Demonstrated REST APIs experience", "confidence": 76, "explanation": "..." }
    ],
    "missingSkills": [
      { "name": "Docker", "category": "DevOps", "priority": "Medium", "context": "..." }
    ],
    "uncertainSkills": [],
    "keywordsFound": [ { "keyword": "React", "count": 6, "relevance": "High" } ],
    "keywordsMissing": [ { "keyword": "CI/CD", "importance": "Medium", "suggestion": "..." } ],
    "experienceRelevance": {
      "yearsRequired": "4+ years",
      "yearsDetected": "5.0 years",
      "levelAssessment": "...",
      "breakdown": [ ... ]
    },
    "resumeSummary": { ... },
    "jobRequirements": { ... },
    "projectAnalysis": { ... },
    "recommendations": [ ... ],
    "improvedBulletPoints": [
      {
        "original": "Worked on backend APIs using Express and Node.js.",
        "improved": "Engineered high-throughput backend APIs using Express and Node.js [quantified impact, e.g., cutting latency by X% across N users].",
        "rationale": "Replaces passive verb with active leadership verb and provides structured metric placeholders."
      }
    ],
    "atsChecks": [
      { "item": "Digital text layer & encoding", "status": "Passed", "message": "..." }
    ],
    "warnings": [],
    "modelMetadata": {
      "engineVersion": "4.0.0-hybrid-semantic",
      "algorithm": "Deterministic-Hybrid-TFIDF-Ngram",
      "executionTimeMs": 48
    }
  }
  ```
- **Status: 400 Bad Request**: Empty resume text or job description fewer than 15 characters.
- **Status: 500 Internal Server Error**: Internal parsing or extraction failure.

### `POST /extract-text`
Extracts raw plain text and page metadata from PDF and DOCX files.
- **Content-Type**: `multipart/form-data`
- **Form Field**: `file` (Binary document)
- **Status: 200 OK**
- **Status: 400 Bad Request**
- **Status: 413 Payload Too Large**
- **Status: 422 Unprocessable Entity**

### `GET /health`
Returns health status and capabilities of the Python microservice.
- **Status: 200 OK**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-15T10:00:00.000Z",
    "service": "ml-service",
    "version": "2.0.0",
    "environment": "development",
    "capabilities": [
      "pdf-extraction",
      "docx-extraction",
      "nlp-analysis",
      "skill-normalization",
      "semantic-matching",
      "compatibility-scoring"
    ]
  }
  ```
