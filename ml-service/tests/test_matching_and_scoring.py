import pytest
from app.services.semantic_matching import matcher_service
from app.services.scoring import calculate_compatibility_score, get_score_label


def test_exact_and_alias_skill_matching():
    resume_skills = [
        {"name": "React", "category": "Frontend", "level": "Expert", "confidence": 95, "evidence": "Built React app"},
        {"name": "Python", "category": "Languages", "level": "Proficient", "confidence": 90, "evidence": "Wrote Python APIs"},
    ]
    required = ["React", "Python"]
    preferred = ["Docker"]

    result = matcher_service.match_requirements(
        resume_skills=resume_skills,
        required_skills=required,
        preferred_skills=preferred,
        resume_text="Built React app and wrote Python APIs",
        jd_text="Requirements: React, Python. Preferred: Docker.",
    )

    matched_names = {s["name"] for s in result["matchedSkills"]}
    assert "React" in matched_names
    assert "Python" in matched_names
    missing_names = {s["name"] for s in result["missingSkills"]}
    assert "Docker" in missing_names
    assert result["skillMatchSummary"]["matchedCount"] >= 2


def test_partial_match_ecosystem():
    # Candidate knows Next.js, job requires React
    resume_skills = [
        {"name": "Next.js", "category": "Frontend", "level": "Proficient", "confidence": 90, "evidence": "Built Next.js app"}
    ]
    required = ["React"]
    preferred = []

    result = matcher_service.match_requirements(
        resume_skills=resume_skills,
        required_skills=required,
        preferred_skills=preferred,
        resume_text="Built Next.js web application",
        jd_text="Looking for a React developer",
    )

    partial_names = {s["name"] for s in result["partiallyMatchedSkills"]}
    assert "React" in partial_names
    partial_item = next(s for s in result["partiallyMatchedSkills"] if s["name"] == "React")
    assert partial_item["confidence"] < 90  # Partial match receives less confidence than exact match


def test_no_double_counting():
    # If a skill is listed multiple times, it is only matched once
    resume_skills = [
        {"name": "React", "category": "Frontend", "level": "Expert", "confidence": 95, "evidence": "React 1"},
        {"name": "React", "category": "Frontend", "level": "Proficient", "confidence": 85, "evidence": "React 2"},
    ]
    required = ["React"]
    preferred = ["React"]

    result = matcher_service.match_requirements(
        resume_skills=resume_skills,
        required_skills=required,
        preferred_skills=preferred,
        resume_text="React React",
        jd_text="React",
    )

    react_matches = [s for s in result["matchedSkills"] if s["name"] == "React"]
    assert len(react_matches) == 1


def test_scoring_weights_required_vs_preferred():
    structural_audit = {
        "wordCount": 450,
        "hasEmail": True,
        "hasPhone": True,
        "detectedSections": ["experience", "education", "skills"],
    }
    exp_profile = {
        "totalYearsNumeric": 5.0,
        "yearsRequiredStr": "3+ years",
        "detectedProjects": ["Project A", "Project B"],
    }
    kw_analysis = {
        "keywordsFound": [{"keyword": "Python", "count": 2}],
        "keywordsMissing": [],
    }

    # Case A: Missing required skill
    score_a = calculate_compatibility_score(
        matched_skills=[],
        partially_matched_skills=[],
        missing_skills=[{"name": "Python", "priority": "High"}],
        required_skills=["Python"],
        preferred_skills=["Docker"],
        experience_profile=exp_profile,
        keyword_analysis=kw_analysis,
        structural_audit=structural_audit,
    )

    # Case B: Matched required skill, missing preferred skill
    score_b = calculate_compatibility_score(
        matched_skills=[{"name": "Python", "category": "Languages"}],
        partially_matched_skills=[],
        missing_skills=[{"name": "Docker", "priority": "Medium"}],
        required_skills=["Python"],
        preferred_skills=["Docker"],
        experience_profile=exp_profile,
        keyword_analysis=kw_analysis,
        structural_audit=structural_audit,
    )

    # Missing required skills must have significantly lower score than having required skills
    assert score_b["overallScore"] > score_a["overallScore"]
    assert (score_b["overallScore"] - score_a["overallScore"]) >= 30


def test_score_bounds_and_empty_resume():
    empty_audit = {
        "wordCount": 5,
        "hasEmail": False,
        "hasPhone": False,
        "detectedSections": [],
    }
    score_empty = calculate_compatibility_score(
        matched_skills=[],
        partially_matched_skills=[],
        missing_skills=[],
        required_skills=["Python"],
        preferred_skills=[],
        experience_profile={"totalYearsNumeric": 0.0},
        keyword_analysis={"keywordsFound": [], "keywordsMissing": []},
        structural_audit=empty_audit,
    )

    assert score_empty["overallScore"] == 0
    assert score_empty["status"] == "insufficient_data"


def test_score_label_tiers():
    assert get_score_label(92) == "Excellent Match"
    assert get_score_label(80) == "Strong Match"
    assert get_score_label(70) == "Good Match"
    assert get_score_label(52) == "Moderate Match"
    assert get_score_label(30) == "Low Match"
