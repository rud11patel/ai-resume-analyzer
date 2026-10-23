import re
from typing import Dict, List, Optional, Any, Set, Tuple
from app.services.skill_normalization import normalize_skill_name, SKILL_ALIASES, SKILL_TAXONOMY
from app.services.text_preprocessing import segment_resume_sections, extract_bullet_points, clean_text

MONTHS_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

YEARS_EXPLICIT_REGEX = re.compile(
    r"(\b\d{1,2}(?:\.\d+)?)\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:experience|work|software|engineering|industry))?\b",
    re.IGNORECASE,
)

DATE_RANGE_REGEX = re.compile(
    r"\b(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(20\d\d|19\d\d)\s*(?:-|–|to)\s*(?:(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+)?(present|current|20\d\d)\b",
    re.IGNORECASE,
)

DEGREE_MENTIONS = [
    (re.compile(r"\b(?:ph\.?d\.?|doctor\s+of\s+philosophy)\b", re.IGNORECASE), "Doctorate"),
    (re.compile(r"\b(?:master'?s?|m\.?s\.?|m\.?tech\.?|m\.?e\.?|mba)\b", re.IGNORECASE), "Master's"),
    (re.compile(r"\b(?:bachelor'?s?|b\.?s\.?|b\.?tech\.?|b\.?e\.?|b\.?a\.?)\b", re.IGNORECASE), "Bachelor's"),
    (re.compile(r"\b(?:associate'?s?|a\.?s\.?)\b", re.IGNORECASE), "Associate"),
]

DISCIPLINE_PATTERNS = [
    (re.compile(r"\b(?:computer\s+science|software\s+engineering|information\s+technology|electrical\s+engineering|computer\s+engineering|data\s+science|informatics)\b", re.IGNORECASE), "technology"),
    (re.compile(r"\b(?:nursing|clinical|medicine|healthcare|bsn|msn|registered\s+nurse|health\s+sciences)\b", re.IGNORECASE), "healthcare"),
    (re.compile(r"\b(?:accounting|finance|business\s+administration|economics|mba)\b", re.IGNORECASE), "business"),
]


def merge_date_intervals(intervals: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
    """Merges overlapping or contiguous calendar month intervals to eliminate double-counting."""
    if not intervals:
        return []
    sorted_ivs = sorted(intervals, key=lambda x: x[0])
    merged: List[List[int]] = [[sorted_ivs[0][0], sorted_ivs[0][1]]]
    for s, e in sorted_ivs[1:]:
        if s <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return [(m[0], m[1]) for m in merged]


def extract_skills_with_evidence(
    text: str,
    sections: Optional[Dict[str, str]] = None,
) -> List[Dict[str, Any]]:
    """
    Extracts skills with section context, confidence levels, and distinction between
    demonstrated accomplishment evidence and declared-only mentions.
    """
    if not sections:
        sections = segment_resume_sections(text)

    extracted: Dict[str, Dict[str, Any]] = {}
    exp_and_proj_text = (sections.get("experience", "") + "\n" + sections.get("projects", "")).lower()

    section_weights = {
        "experience": 95,
        "projects": 90,
        "skills": 75,
        "summary": 75,
        "education": 70,
        "header": 60,
        "other": 65,
    }

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
                if alias in ["c++", "cpp"]:
                    pattern = r"(?<![a-zA-Z0-9])(?:c\+\+|cpp)(?![a-zA-Z0-9])"
                elif alias in ["c#", "csharp"]:
                    pattern = r"(?<![a-zA-Z0-9])(?:c\#|csharp)(?![a-zA-Z0-9])"
                elif alias in [".net", "dotnet"]:
                    pattern = r"(?<![a-zA-Z0-9])(?:\.net|dotnet)(?![a-zA-Z0-9])"
                elif alias == "c":
                    pattern = r"(?<![a-zA-Z0-9_])c(?![a-zA-Z0-9_#\+\.\-])"
                else:
                    pattern = r"(?<![a-zA-Z0-9])" + re.escape(alias) + r"(?![a-zA-Z0-9])"

                if re.search(pattern, line_lower):
                    cat = SKILL_TAXONOMY.get(canonical, "General")

                    evidence = line_str
                    if len(evidence) > 130:
                        evidence = evidence[:127] + "..."

                    # Level inference
                    level = "Proficient"
                    if any(term in line_lower for term in ["lead", "architect", "expert", "advanced", "5+ years", "senior", "principal"]):
                        level = "Expert"
                    elif any(term in line_lower for term in ["basic", "familiar", "exposure", "learning", "novice"]):
                        level = "Intermediate"

                    # Verify if skill is actually demonstrated in experience or projects
                    is_demonstrated = (sec_name in ["experience", "projects"]) or (alias in exp_and_proj_text)
                    confidence = base_confidence if is_demonstrated else 72
                    if is_demonstrated and level == "Expert":
                        confidence = 96

                    if canonical not in extracted or extracted[canonical]["confidence"] < confidence:
                        extracted[canonical] = {
                            "name": canonical,
                            "category": cat,
                            "level": level,
                            "confidence": confidence,
                            "evidence": evidence,
                            "section": sec_name,
                            "isDemonstrated": is_demonstrated,
                        }

    return list(extracted.values())


def extract_resume_profile(text: str) -> Dict[str, Any]:
    """
    Extracts comprehensive resume profile attributes:
    - Non-overlapping career tenure via calendar interval union
    - Degree level and academic discipline (STEM, Healthcare, Business)
    - Candidate primary professional domain
    - Projects list with tech tags and scope
    - Professional employment vs academic projects distinction
    """
    cleaned = clean_text(text)
    sections = segment_resume_sections(cleaned)
    skills = extract_skills_with_evidence(cleaned, sections)

    # 1. Experience Years Detection (Union of Non-Overlapping Intervals)
    years_detected_str = "Not specified"
    total_years = 0.0

    exp_text = sections.get("experience", "") + "\n" + sections.get("summary", "")
    explicit_matches = YEARS_EXPLICIT_REGEX.findall(exp_text)
    if explicit_matches:
        try:
            years_val = float(explicit_matches[0])
            years_detected_str = f"{years_val:.1f} years"
            total_years = years_val
        except ValueError:
            pass

    # Extract date intervals with months and merge overlaps
    if total_years == 0.0:
        raw_intervals: List[Tuple[int, int]] = []
        for m_start, y_start, m_end, y_end in DATE_RANGE_REGEX.findall(exp_text):
            try:
                s_yr = int(y_start)
                s_mo = MONTHS_MAP.get((m_start or "").lower(), 1)
                s_idx = s_yr * 12 + s_mo

                if any(p in y_end.lower() for p in ["present", "current"]):
                    e_yr = 2026
                    e_mo = 10
                else:
                    e_yr = int(y_end)
                    e_mo = MONTHS_MAP.get((m_end or "").lower(), 12)
                e_idx = e_yr * 12 + e_mo

                if 1980 * 12 < s_idx <= e_idx <= 2030 * 12:
                    raw_intervals.append((s_idx, e_idx))
            except ValueError:
                continue

        if raw_intervals:
            merged_ivs = merge_date_intervals(raw_intervals)
            total_months = sum(e - s for s, e in merged_ivs)
            est_years = round(total_months / 12.0, 1)
            if est_years > 0:
                years_detected_str = f"{est_years:.1f} years"
                total_years = est_years

    # Check for intern / student titles
    has_intern_title = bool(re.search(r"\b(?:intern|internship|student|co-op|apprentice)\b", exp_text, re.IGNORECASE))
    is_senior_role = bool(re.search(r"\b(?:senior|lead|staff|principal|director|manager)\b", exp_text, re.IGNORECASE))

    # 2. Education summary, degree level, and discipline
    edu_text = sections.get("education", "")
    qualifications_summary = "Not detected"
    detected_degree_level = "Not specified"
    detected_discipline = "general"

    if edu_text:
        edu_lines = [l.strip() for l in edu_text.split("\n") if len(l.strip()) > 8]
        if edu_lines:
            qualifications_summary = edu_lines[0]

        for deg_pat, deg_name in DEGREE_MENTIONS:
            if deg_pat.search(edu_text):
                detected_degree_level = deg_name
                break

        for disc_pat, disc_name in DISCIPLINE_PATTERNS:
            if disc_pat.search(edu_text):
                detected_discipline = disc_name
                break

    # 3. Projects extraction with technology tags
    proj_text = sections.get("projects", "")
    detected_projects: List[str] = []
    project_details: List[Dict[str, Any]] = []

    if proj_text:
        bullets = extract_bullet_points(proj_text)
        detected_projects = bullets[:5]
        for b in bullets[:5]:
            b_skills = [
                s["name"] for s in skills
                if s["name"].lower() in b.lower()
            ]
            project_details.append({
                "description": b,
                "skillsUsed": b_skills,
                "isAcademic": bool(re.search(r"\b(?:coursework|academic|thesis|capstone|class)\b", b, re.IGNORECASE)),
            })

    # 4. Candidate Primary Domain
    candidate_domain = "Software / Technology"
    if detected_discipline == "healthcare" or any(s["category"] == "Healthcare" for s in skills):
        candidate_domain = "Healthcare / Clinical"
    elif detected_discipline == "business":
        candidate_domain = "Business / Finance"

    # 5. Top Skill Categories
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
        "hasInternTitle": has_intern_title,
        "isSeniorRole": is_senior_role,
        "qualificationsSummary": qualifications_summary,
        "detectedDegreeLevel": detected_degree_level,
        "detectedDiscipline": detected_discipline,
        "candidateDomain": candidate_domain,
        "detectedProjects": detected_projects,
        "projectDetails": project_details,
        "topSkillCategories": top_categories,
        "skills": skills,
        "sections": sections,
    }
