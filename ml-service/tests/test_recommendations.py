import pytest
from app.services.recommendation_engine import (
    generate_improved_bullet_points,
    generate_recommendations,
    generate_ats_checks,
)


def test_bullet_point_improvement_without_fabrication():
    raw_bullets = [
        "Worked on backend APIs using Express and Node.js.",
        "Responsible for writing unit tests with Jest.",
    ]
    matched_skills = [{"name": "Node.js"}, {"name": "Express.js"}, {"name": "Jest"}]

    improved = generate_improved_bullet_points(raw_bullets, matched_skills)
    assert len(improved) >= 1

    first = improved[0]
    assert "worked on" not in first["improved"].lower()
    # Check that placeholders are present for user verification, rather than invented fake metrics
    assert "[" in first["improved"] and "]" in first["improved"]
    assert "rationale" in first
    assert len(first["rationale"]) > 10


def test_recommendations_generation():
    missing_skills = [{"name": "Kubernetes", "priority": "High"}]
    partially_matched = [{"name": "React", "explanation": "Demonstrated Next.js competence"}]
    structural_audit = {
        "hasLinkedIn": False,
        "hasGitHub": False,
    }
    kw_analysis = {
        "keywordsMissing": [{"keyword": "CI/CD"}]
    }

    recs = generate_recommendations(
        missing_skills=missing_skills,
        partially_matched_skills=partially_matched,
        structural_audit=structural_audit,
        keyword_analysis=kw_analysis,
        years_detected=3.0,
        years_required_str="4+ years",
    )

    assert len(recs) >= 3
    impact_levels = {r["impact"] for r in recs}
    assert "High Impact" in impact_levels
    assert any("Kubernetes" in r["title"] for r in recs)


def test_ats_checks():
    passing_audit = {
        "hasEmail": True,
        "hasPhone": True,
        "detectedSections": ["experience", "education", "skills"],
        "wordCount": 600,
    }
    checks = generate_ats_checks(passing_audit)
    assert all(c["status"] == "Passed" for c in checks)

    failing_audit = {
        "hasEmail": False,
        "hasPhone": False,
        "detectedSections": ["experience"],
        "wordCount": 80,
    }
    f_checks = generate_ats_checks(failing_audit)
    assert any(c["status"] == "Warning" for c in f_checks)
