from typing import Dict, List, Any, Optional
from app.core.config import settings


def get_score_label(score: int) -> str:
    """
    Returns an explainable, descriptive match tier label for the overall compatibility score.
    """
    if score >= 85:
        return "Excellent Match"
    elif score >= 75:
        return "Strong Match"
    elif score >= 60:
        return "Good Match"
    elif score >= 45:
        return "Moderate Match"
    else:
        return "Low Match"


def calculate_compatibility_score(
    matched_skills: List[Dict[str, Any]],
    partially_matched_skills: List[Dict[str, Any]],
    missing_skills: List[Dict[str, Any]],
    required_skills: List[str],
    preferred_skills: List[str],
    experience_profile: Dict[str, Any],
    keyword_analysis: Dict[str, Any],
    structural_audit: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Computes a deterministic, explainable resume-to-job compatibility score between 0 and 100.
    
    Mathematical formula:
      Score = w_req * S_req + w_pref * S_pref + w_exp * S_exp + w_kw * S_kw + w_ats * S_ats
      where weights are strictly defined and sum to 1.0.
      
    Weights:
      - Required Skills (w_req = 0.40): Primary technical requirements filter.
      - Preferred Skills (w_pref = 0.15): Secondary/bonus skills.
      - Experience Relevance (w_exp = 0.20): Seniority, tenure, and project accomplishments.
      - Keyword Alignment (w_kw = 0.15): High-priority ATS keyword presence.
      - ATS Formatting & Readability (w_ats = 0.10): Document parseability, headings, structure.
    """
    weights = settings.weights

    # Handle insufficient data edge cases
    word_count = structural_audit.get("wordCount", 0)
    if word_count < 25:
        return {
            "status": "insufficient_data",
            "overallScore": 0,
            "scoreLabel": "Low Match",
            "subScores": {
                "technicalSkills": 0,
                "experienceRelevance": 0,
                "atsFormatting": 0,
                "keywordDensity": 0,
            },
            "scoreBreakdown": {
                "components": [],
                "calculationFormula": "Score = 0 (Insufficient resume text provided)",
            },
            "explanation": "Uploaded resume text is too short or empty for meaningful ATS evaluation.",
        }

    # 1. Required Skills Score (S_req)
    req_set = {r.lower() for r in required_skills}
    matched_req_count = sum(1 for s in matched_skills if s["name"].lower() in req_set)
    partial_req_count = sum(1 for s in partially_matched_skills if s["name"].lower() in req_set)

    if required_skills:
        # Partial match gets half credit (0.5)
        raw_req = ((matched_req_count + 0.5 * partial_req_count) / len(required_skills)) * 100
        score_req = min(100, max(0, int(round(raw_req))))
    else:
        score_req = 80 if matched_skills else 50

    # 2. Preferred Skills Score (S_pref)
    pref_set = {p.lower() for p in preferred_skills}
    matched_pref_count = sum(1 for s in matched_skills if s["name"].lower() in pref_set)
    partial_pref_count = sum(1 for s in partially_matched_skills if s["name"].lower() in pref_set)

    if preferred_skills:
        raw_pref = ((matched_pref_count + 0.5 * partial_pref_count) / len(preferred_skills)) * 100
        score_pref = min(100, max(0, int(round(raw_pref))))
    else:
        score_pref = 80

    # Combined Technical Skills SubScore for UI display: 73% required, 27% preferred
    ui_technical_score = int(round(0.73 * score_req + 0.27 * score_pref))

    # 3. Experience Relevance Score (S_exp)
    years_detected = experience_profile.get("totalYearsNumeric", 0.0)
    # Detect target required years if present
    target_years = 3.0  # default baseline
    years_req_str = experience_profile.get("yearsRequiredStr", "")
    import re
    m_yr = re.search(r"(\d+)", years_req_str)
    if m_yr:
        target_years = float(m_yr.group(1))

    if years_detected >= target_years:
        exp_tenure_score = 100
    elif years_detected > 0:
        exp_tenure_score = int((years_detected / target_years) * 100)
    else:
        # If no explicit years parsed, use presence of experience and projects sections
        exp_tenure_score = 75 if "experience" in structural_audit.get("detectedSections", []) else 40

    # Bonus for projects detected
    proj_count = len(experience_profile.get("detectedProjects", []))
    proj_factor = min(20, proj_count * 5)
    score_exp = min(100, max(0, int(round(0.80 * exp_tenure_score + proj_factor))))

    # 4. Keyword Alignment Score (S_kw)
    kw_found = len(keyword_analysis.get("keywordsFound", []))
    kw_missing = len(keyword_analysis.get("keywordsMissing", []))
    total_kw = kw_found + kw_missing
    if total_kw > 0:
        score_kw = min(100, max(0, int(round((kw_found / total_kw) * 100))))
    else:
        score_kw = 75

    # 5. ATS Formatting & Readability Score (S_ats)
    score_ats = 100
    # Penalty for missing contact info
    if not structural_audit.get("hasEmail", False):
        score_ats -= 15
    if not structural_audit.get("hasPhone", False):
        score_ats -= 10
    # Penalty for missing core sections
    det_sec = set(structural_audit.get("detectedSections", []))
    for expected_sec in ["experience", "education", "skills"]:
        if expected_sec not in det_sec:
            score_ats -= 15
    # Word count sanity check (optimal 350 - 1500 words)
    if word_count < 200 or word_count > 2000:
        score_ats -= 10
    score_ats = min(100, max(20, score_ats))

    # Compute overall weighted score
    overall_float = (
        weights.required_skills * score_req
        + weights.preferred_skills * score_pref
        + weights.experience_relevance * score_exp
        + weights.keyword_density * score_kw
        + weights.ats_formatting * score_ats
    )
    overall_score = min(100, max(0, int(round(overall_float))))
    score_label = get_score_label(overall_score)

    components = [
        {
            "name": "Required Qualifications Coverage",
            "weight": weights.required_skills,
            "rawScore": score_req,
            "weightedScore": round(weights.required_skills * score_req, 2),
            "explanation": f"Matched {matched_req_count} mandatory skills with {partial_req_count} partial matches out of {len(required_skills)} required.",
        },
        {
            "name": "Preferred Skills Coverage",
            "weight": weights.preferred_skills,
            "rawScore": score_pref,
            "weightedScore": round(weights.preferred_skills * score_pref, 2),
            "explanation": f"Matched {matched_pref_count} preferred skills out of {len(preferred_skills)} desired bonus qualifications.",
        },
        {
            "name": "Experience & Seniority Fit",
            "weight": weights.experience_relevance,
            "rawScore": score_exp,
            "weightedScore": round(weights.experience_relevance * score_exp, 2),
            "explanation": f"Detected career tenure of ~{years_detected:.1f} years against target expectation with {proj_count} project highlights.",
        },
        {
            "name": "Technical Keyword Alignment",
            "weight": weights.keyword_density,
            "rawScore": score_kw,
            "weightedScore": round(weights.keyword_density * score_kw, 2),
            "explanation": f"Identified {kw_found} high-value ATS keyword occurrences from job posting requirements.",
        },
        {
            "name": "ATS Formatting & Structural Hygiene",
            "weight": weights.ats_formatting,
            "rawScore": score_ats,
            "weightedScore": round(weights.ats_formatting * score_ats, 2),
            "explanation": f"Standard section headings detected: {', '.join(det_sec) if det_sec else 'None'}.",
        },
    ]

    return {
        "status": "completed",
        "overallScore": overall_score,
        "scoreLabel": score_label,
        "subScores": {
            "technicalSkills": ui_technical_score,
            "experienceRelevance": score_exp,
            "atsFormatting": score_ats,
            "keywordDensity": score_kw,
        },
        "scoreBreakdown": {
            "components": components,
            "calculationFormula": "OverallScore = 0.40 * ReqSkills + 0.15 * PrefSkills + 0.20 * Experience + 0.15 * Keywords + 0.10 * Formatting",
        },
    }
