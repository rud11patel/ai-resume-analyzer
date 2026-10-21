import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

SAMPLE_RESUME = """
Alex Morgan
alex.morgan@example.com | (555) 019-2834 | linkedin.com/in/alexmorgan | github.com/alexmorgan

SUMMARY
Senior Software Engineer with 5+ years of experience designing scalable web applications and microservices.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, SQL, HTML5, CSS3
Frameworks: React, Next.js, Node.js, Express.js, Tailwind CSS
Databases & Cloud: PostgreSQL, MongoDB, Redis, Docker, AWS, Git
Testing: Jest, Cypress, Unit Testing

WORK EXPERIENCE
Senior Full Stack Engineer | FinTech Cloud (2021 - Present)
- Architected 14+ reusable React components and micro-frontends with Tailwind CSS.
- Engineered high-throughput REST APIs and backend microservices using Node.js, Express.js, and PostgreSQL.
- Streamlined automated CI/CD deployment pipelines using Docker and GitHub Actions.
- Conducted unit testing and end-to-end testing with Jest and Cypress.

Software Engineer | Alpha Systems (2019 - 2021)
- Developed customer-facing dashboard features using React, TypeScript, and MongoDB.
- Optimized PostgreSQL database queries, reducing average latency by 35%.

EDUCATION
Bachelor of Science in Computer Science | University of Technology (2015 - 2019)

PROJECTS
Cloud Analytics Dashboard - Real-time metrics visualization platform built with Next.js, FastAPI, and PostgreSQL.
"""

SAMPLE_JD = """
Job Title: Senior Frontend Engineer
Company: Stripe
Location: Remote

About the Role:
We are looking for a Senior Frontend Engineer to build world-class user experiences.

Minimum Qualifications:
- 4+ years of professional software engineering experience.
- Strong proficiency in React, TypeScript, and modern JavaScript (ES6+).
- Hands-on experience with Tailwind CSS, Next.js, and responsive design.
- Demonstrated experience writing automated unit tests (e.g., Jest).

Preferred Qualifications:
- Experience with Docker, GraphQL, and micro-frontend architectures.
- Familiarity with CI/CD automation and AWS cloud infrastructure.

Responsibilities:
- Design and implement scalable frontend architecture for millions of global users.
- Partner with product designers and backend engineers to define API contracts.
"""


def test_analyze_endpoint_success():
    payload = {
        "resume_text": SAMPLE_RESUME,
        "job_description": SAMPLE_JD,
        "role_title": "Senior Frontend Engineer",
        "company": "Stripe",
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "completed"
    assert 0 <= data["overallScore"] <= 100
    assert data["scoreLabel"] in ["Excellent Match", "Strong Match", "Good Match", "Moderate Match", "Low Match"]

    # Verify subScores
    sub = data["subScores"]
    assert "technicalSkills" in sub
    assert "experienceRelevance" in sub
    assert "atsFormatting" in sub
    assert "keywordDensity" in sub

    # Verify matchedSkills & missingSkills
    matched_names = {s["name"] for s in data["matchedSkills"]}
    assert "React" in matched_names
    assert "TypeScript" in matched_names

    # Verify keywords
    assert len(data["keywordsFound"]) > 0

    # Verify recommendations
    assert len(data["recommendations"]) >= 1

    # Verify bullet improvements
    assert len(data["improvedBulletPoints"]) >= 1

    # Verify ATS checks
    assert len(data["atsChecks"]) >= 3


def test_analyze_endpoint_empty_resume():
    payload = {
        "resume_text": "",
        "job_description": SAMPLE_JD,
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 400
    assert "Resume text must not be empty" in response.json()["error"]


def test_analyze_endpoint_short_jd():
    payload = {
        "resume_text": SAMPLE_RESUME,
        "job_description": "too short",
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 400
    assert "at least 15 characters" in response.json()["error"]


def test_analyze_insufficient_data():
    payload = {
        "resume_text": "Hi this is a very short resume with only a few words.",
        "job_description": SAMPLE_JD,
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "insufficient_data"
    assert data["overallScore"] == 0
