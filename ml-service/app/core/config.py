import os
from pydantic import BaseModel
from typing import Dict


class ScoringWeights(BaseModel):
    """
    Explicit weights for deterministic compatibility scoring.
    Sum of weights is 1.0 (100%).
    Rationale:
    - required_skills (0.40): Job requirements are the most critical filtering criteria.
    - preferred_skills (0.15): Bonus/preferred qualifications differentiate candidates.
    - experience_relevance (0.20): Seniority, tenure, and project accomplishments validate practical capability.
    - keyword_density (0.15): Relevant technical vocabulary alignment ensures ATS indexability.
    - ats_formatting (0.10): Document parseability, standard sections, and clean typography.
    """
    required_skills: float = 0.40
    preferred_skills: float = 0.15
    experience_relevance: float = 0.20
    keyword_density: float = 0.15
    ats_formatting: float = 0.10


class Settings(BaseModel):
    app_name: str = "AI Resume Analyzer - ML & NLP Analysis Engine"
    app_version: str = "2.0.0"
    environment: str = os.getenv("ENVIRONMENT", "development")
    
    # Matching thresholds
    exact_match_threshold: float = 1.00
    semantic_partial_threshold: float = 0.70
    semantic_uncertain_threshold: float = 0.45

    # Scoring configuration
    weights: ScoringWeights = ScoringWeights()

    # Model and NLP metadata
    engine_version: str = "4.0.0-hybrid-semantic"
    algorithm_name: str = "Deterministic-Hybrid-TFIDF-Ngram"


settings = Settings()
