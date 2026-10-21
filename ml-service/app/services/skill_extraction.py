import re
from typing import Dict, List, Optional, Any, Set, Tuple
from app.services.skill_normalization import normalize_skill_name, SKILL_ALIASES, SKILL_TAXONOMY
from app.services.text_preprocessing import segment_resume_sections, extract_bullet_points, clean_text


YEARS_EXP_PATTERNS = [
    re.compile(r"(\b\d{1,2}(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:experience|work|software|industry))?\b", re.IGNORECASE),
    re.compile(r"\b(20\d\d|19\d\d)\s*(?:-|–|to)\s*(present|current|20\d\d)\b", re.IGNORECASE),
]

DEGREE_MENTIONS = [
    "bachelor", "master", "phd", "ph.d", "b.s.", "m.s.", "b.tech", "m.tech", "b.e.", "associate degree"
]


def extract_skills_with_evidence(
    text: str,
    sections: Optional[Dict[str, str]] = None,
) -> List[Dict[str, Any]]:
    """
    Extracts skills with section context, confidence levels, and short evidence excerpts.
    Prevents false positives by evaluating the context where the skill was identified.
    """
    if not sections:
        sections = segment_resume_sections(text)

    # Track extracted canonical skills to avoid duplicates
    extracted: Dict[str, Dict[str, Any]] = {}

    # Define section weightings for confidence
    section_weights = {
        "skills": 95,
        "experience": 90,
        "projects": 85,
        "summary": 75,
        "education": 70,
        "header": 60,
        "other": 65,
    }

    # Helper to find skills in a given text block
    for sec_name, sec_content in sections.items():
        if not sec_content:
            continue
            
        base_confidence = section_weights.get(sec_name, 70)
        lines = sec_content.split("\n")

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            line_lower = line_str.lower()

            for alias, canonical in SKILL_ALIASES.items():
                # Word boundary match to avoid substring false positives (e.g., 'go' in 'good')
                pattern = r"(?<![a-zA-Z0-9])" + re.escape(alias) + r"(?![a-zA-Z0-9])"
                if alias in ["c++", "cpp"]:
                    pattern = r"(?<![a-zA-Z0-9])(?:c\+\+|cpp)(?![a-zA-Z0-9])"
                elif alias in ["c#", "csharp"]:
                    pattern = r"(?<![a-zA-Z0-9])(?:c\#|csharp)(?![a-zA-Z0-9])"
                elif alias in [".net", "dotnet"]:
                    pattern = r"(?<![a-zA-Z0-9])(?:\.net|dotnet)(?![a-zA-Z0-9])"

                if re.search(pattern, line_lower):
                    cat = SKILL_TAXONOMY.get(canonical, "General")
                    
                    # Create evidence excerpt (truncate if long)
                    evidence = line_str
                    if len(evidence) > 130:
                        evidence = evidence[:127] + "..."

                    # Level inference
                    level = "Proficient"
                    if any(term in line_lower for term in ["lead", "architect", "expert", "advanced", "5+ years", "senior"]):
                        level = "Expert"
                    elif any(term in line_lower for term in ["basic", "familiar", "exposure", "learning"]):
                        level = "Intermediate"

                    confidence = base_confidence
                    if sec_name == "skills":
                        confidence = 96
                    elif sec_name == "experience" and level == "Expert":
                        confidence = 94

                    # Update if not present or if this section provides higher confidence
                    if canonical not in extracted or extracted[canonical]["confidence"] < confidence:
                        extracted[canonical] = {
                            "name": canonical,
                            "category": cat,
                            "level": level,
                            "confidence": confidence,
                            "evidence": evidence,
                            "section": sec_name,
                        }

    return list(extracted.values())


def extract_resume_profile(text: str) -> Dict[str, Any]:
    """
    Extracts high-level resume attributes:
    - Detected experience duration
    - Detected education summary
    - Projects count and summaries
    - Section presence
    """
    cleaned = clean_text(text)
    sections = segment_resume_sections(cleaned)
    skills = extract_skills_with_evidence(cleaned, sections)

    # 1. Experience Years Detection
    years_detected_str = "Not specified"
    total_years = 0.0

    # Look for explicit mentions like "5+ years experience"
    exp_text = sections.get("experience", "") + "\n" + sections.get("summary", "")
    explicit_matches = YEARS_EXP_PATTERNS[0].findall(exp_text)
    if explicit_matches:
        try:
            years_val = float(explicit_matches[0])
            years_detected_str = f"{years_val:.1f} years"
            total_years = years_val
        except ValueError:
            pass

    # Look for date ranges like 2021 - 2025
    if total_years == 0.0:
        date_matches = YEARS_EXP_PATTERNS[1].findall(exp_text)
        if date_matches:
            est_years = 0.0
            for start_yr, end_yr in date_matches:
                try:
                    s = int(start_yr)
                    e = 2026 if any(p in end_yr.lower() for p in ["present", "current"]) else int(end_yr)
                    if 1980 < s <= e <= 2030:
                        est_years += (e - s)
                except ValueError:
                    continue
            if est_years > 0:
                years_detected_str = f"{est_years:.1f} years"
                total_years = est_years

    # 2. Education summary
    edu_text = sections.get("education", "")
    qualifications_summary = "Not detected"
    if edu_text:
        edu_lines = [l.strip() for l in edu_text.split("\n") if len(l.strip()) > 10]
        if edu_lines:
            qualifications_summary = edu_lines[0]

    # 3. Projects extraction
    proj_text = sections.get("projects", "")
    detected_projects = []
    if proj_text:
        bullets = extract_bullet_points(proj_text)
        detected_projects = bullets[:5]

    # 4. Top Skill Categories
    cat_counts: Dict[str, int] = {}
    for s in skills:
        c = s["category"]
        cat_counts[c] = cat_counts.get(c, 0) + 1
    top_categories = sorted(cat_counts.keys(), key=lambda k: -cat_counts[k])[:4]

    return {
        "wordCount": len(cleaned.split()),
        "sectionsDetected": [s for s, t in sections.items() if s not in ["header", "other"] and len(t) > 15],
        "yearsDetected": years_detected_str,
        "totalYearsNumeric": total_years,
        "qualificationsSummary": qualifications_summary,
        "detectedProjects": detected_projects,
        "topSkillCategories": top_categories,
        "skills": skills,
        "sections": sections,
    }
