import os
from pydantic import BaseModel
from typing import Dict


class ScoringWeights(BaseModel):
    """
    Explicit weights for deterministic role-compatibility scoring.
    Sum of base weights is 1.0 (100%).
    
    Starting Hypotheses & Rationale:
    - required_skills (0.50): Non-negotiable technical requirements are the primary filter.
    - experience_and_projects (0.25): Relevance-aware tenure, project deliverables, and seniority fit.
    - education_and_eligibility (0.10): Baseline degrees, certifications, and qualification thresholds.
    - preferred_skills (0.10): Bonus / secondary qualifications.
    - role_alignment (0.05): Domain concepts and engineering practices without double-counting skills.
    - ats_formatting (0.00): ATS formatting & parseability is evaluated independently and excluded
      from the job-compatibility score so layout doesn't inflate role suitability.
      
    Weight Normalization Policy:
    When a dimension is not applicable (e.g. JD has no preferred skills, or specifies no
    education requirements), its weight is redistributed proportionally across active dimensions
    so that active weights strictly sum to 1.0 (100%).
    """
    required_skills: float = 0.50
    experience_and_projects: float = 0.25
    education_and_eligibility: float = 0.10
    preferred_skills: float = 0.10
    role_alignment: float = 0.05
    ats_formatting: float = 0.00

    # Backward compatibility properties
    @property
    def experience_relevance(self) -> float:
        return self.experience_and_projects

    @property
    def keyword_density(self) -> float:
        return self.role_alignment


class Settings(BaseModel):
    app_name: str = "AI Resume Analyzer - ML & NLP Analysis Engine"
    app_version: str = "2.1.0"
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # Matching thresholds (calibrated to prevent false equivalence)
    exact_match_threshold: float = 1.00
    ecosystem_relationship_min: float = 0.75
    semantic_candidate_suggest: float = 0.82
    semantic_uncertain_threshold: float = 0.60

    # Scoring configuration
    weights: ScoringWeights = ScoringWeights()

    # Model and NLP metadata
    engine_version: str = "4.1.0-evidence-based"
    algorithm_name: str = "Deterministic-Hybrid-TFIDF-Ngram-Normalized"


settings = Settings()

