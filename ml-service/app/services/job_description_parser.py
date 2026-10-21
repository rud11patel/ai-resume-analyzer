import re
from typing import Dict, List, Optional, Any, Set, Tuple
from app.services.skill_normalization import normalize_skill_name, SKILL_ALIASES, SKILL_TAXONOMY


# Section markers for Job Descriptions
REQUIRED_SECTION_PATTERNS = [
    r"(?:minimum|required)\s+qualifications",
    r"requirements",
    r"what\s+you(?:'ll)?\s+need",
    r"what\s+you\s+bring",
    r"must[\s-]haves?",
    r"core\s+requirements",
    r"basic\s+qualifications",
    r"who\s+you\s+are",
]

PREFERRED_SECTION_PATTERNS = [
    r"preferred\s+qualifications",
    r"nice[\s-]to[\s-]haves?",
    r"bonus\s+(?:points|qualifications)",
    r"plus(?:\s+points)?",
    r"desired\s+skills",
    r"what\s+would\s+be\s+great",
]

RESPONSIBILITY_PATTERNS = [
    r"responsibilities",
    r"what\s+you(?:'ll)?\s+do",
    r"key\s+responsibilities",
    r"duties",
    r"the\s+role",
]

EXPERIENCE_REGEX = re.compile(
    r"(\b\d{1,2}(?:\s*(?:-|to|\+)\s*\d{1,2})?\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:relevant|hands-on|professional|software|engineering|industry))?\s+experience\b)",
    re.IGNORECASE,
)

DEGREE_REGEX = re.compile(
    r"(?:bachelor'?s?|master'?s?|ph\.?d\.?|b\.?s\.?|m\.?s\.?|degree)\s+(?:in|of)\s+[a-zA-Z\s,]+(?:computer\s+science|engineering|information\s+technology|related\s+field|equivalent)",
    re.IGNORECASE,
)

TITLE_PATTERNS = [
    re.compile(r"^(?:position|role|job\s+title)\s*:\s*([^\n\r]+)", re.IGNORECASE),
    re.compile(r"(?:we(?:'re|\s+are)\s+looking\s+for\s+(?:a|an)\s+)([A-Z][a-zA-Z0-9\s/]+(?:Engineer|Developer|Architect|Manager|Lead|Specialist|Scientist))", re.IGNORECASE),
]


def parse_job_description(
    raw_text: str,
    provided_title: Optional[str] = None,
    provided_company: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Parses a raw job description string and returns structured requirements:
    - roleTitle
    - company
    - requiredSkills
    - preferredSkills
    - experienceYearsRequired
    - qualifications
    - responsibilities
    - keywords
    """
    if not raw_text or len(raw_text.strip()) == 0:
        return {
            "roleTitle": provided_title or "Untitled Role",
            "company": provided_company or "Target Company",
            "requiredSkills": [],
            "preferredSkills": [],
            "experienceYearsRequired": "Not specified",
            "qualifications": [],
            "responsibilities": [],
            "keywords": [],
        }

    lines = raw_text.split("\n")
    
    # 1. Infer Title
    detected_title = provided_title
    if not detected_title or detected_title.lower() == "untitled role":
        for line in lines[:8]:
            line_str = line.strip()
            for tp in TITLE_PATTERNS:
                m = tp.search(line_str)
                if m:
                    detected_title = m.group(1).strip()
                    break
            if detected_title:
                break
        
        # Fallback to first non-empty line if short and title-like
        if not detected_title and len(lines) > 0:
            first_line = lines[0].strip()
            if 5 < len(first_line) < 60 and not any(c in first_line for c in [":", "http", "."]):
                detected_title = first_line

    if not detected_title:
        detected_title = "Software Engineer"

    # 2. Segment JD into sections: required, preferred, responsibilities, other
    current_sec = "intro"
    segmented: Dict[str, List[str]] = {
        "intro": [],
        "required": [],
        "preferred": [],
        "responsibilities": [],
        "other": [],
    }

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue
            
        line_clean = re.sub(r"[:\-_#=*]+$", "", line).strip().lower()
        if len(line_clean) < 45:
            matched_sec = None
            for pat in REQUIRED_SECTION_PATTERNS:
                if re.search(pat, line_clean):
                    matched_sec = "required"
                    break
            if not matched_sec:
                for pat in PREFERRED_SECTION_PATTERNS:
                    if re.search(pat, line_clean):
                        matched_sec = "preferred"
                        break
            if not matched_sec:
                for pat in RESPONSIBILITY_PATTERNS:
                    if re.search(pat, line_clean):
                        matched_sec = "responsibilities"
                        break
            if matched_sec:
                current_sec = matched_sec
                continue

        segmented[current_sec].append(line)

    req_text = "\n".join(segmented["required"])
    pref_text = "\n".join(segmented["preferred"])
    resp_text = "\n".join(segmented["responsibilities"])
    full_text = raw_text

    # 3. Extract Years of Experience
    exp_matches = EXPERIENCE_REGEX.findall(full_text)
    years_required = "Not specified"
    if exp_matches:
        years_required = exp_matches[0].strip()

    # 4. Extract Degree Qualifications
    degree_matches = DEGREE_REGEX.findall(full_text)
    qualifications = [d.strip() for d in degree_matches]

    # 5. Extract Required vs Preferred Skills
    # Scan text against SKILL_ALIASES and canonical skills
    all_skills_found: Dict[str, Tuple[str, str, int]] = {}  # canonical -> (category, section, count)

    def extract_skills_from_str(text: str) -> Dict[str, int]:
        found: Dict[str, int] = {}
        # Word boundary search for each alias
        for alias, canonical in SKILL_ALIASES.items():
            pattern = r"(?<![a-zA-Z0-9])" + re.escape(alias) + r"(?![a-zA-Z0-9])"
            # Special case for c++ and c#
            if alias in ["c++", "cpp"]:
                pattern = r"(?<![a-zA-Z0-9])(?:c\+\+|cpp)(?![a-zA-Z0-9])"
            elif alias in ["c#", "csharp"]:
                pattern = r"(?<![a-zA-Z0-9])(?:c\#|csharp)(?![a-zA-Z0-9])"
            elif alias in [".net", "dotnet"]:
                pattern = r"(?<![a-zA-Z0-9])(?:\.net|dotnet)(?![a-zA-Z0-9])"

            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            if matches:
                found[canonical] = found.get(canonical, 0) + len(matches)
        return found

    req_skills_map = extract_skills_from_str(req_text)
    pref_skills_map = extract_skills_from_str(pref_text)
    all_skills_map = extract_skills_from_str(full_text)

    required_skills: List[str] = []
    preferred_skills: List[str] = []

    # If explicit sections were parsed:
    for skill in req_skills_map:
        required_skills.append(skill)

    for skill in pref_skills_map:
        if skill not in required_skills:
            preferred_skills.append(skill)

    # If no explicit sections were found, partition all detected skills heuristically:
    # frequent or core language/framework skills become required, remaining become preferred
    if not required_skills and not preferred_skills:
        for skill, count in sorted(all_skills_map.items(), key=lambda x: -x[1]):
            cat = SKILL_TAXONOMY.get(skill, "General")
            if cat in ["Languages", "Frontend", "Backend"] or count >= 2:
                required_skills.append(skill)
            else:
                preferred_skills.append(skill)

    # Ensure required_skills has at least top identified skills if JD has skills
    if not required_skills and all_skills_map:
        required_skills = list(all_skills_map.keys())[:5]
        preferred_skills = list(all_skills_map.keys())[5:10]

    # 6. Extract Responsibilities
    responsibilities = []
    if segmented["responsibilities"]:
        for r_line in segmented["responsibilities"]:
            clean_r = re.sub(r"^[-*•\d\.]+\s*", "", r_line).strip()
            if len(clean_r) > 20:
                responsibilities.append(clean_r)

    # 7. Keywords with importance
    keywords: List[Dict[str, Any]] = []
    for skill, count in all_skills_map.items():
        importance = "High" if skill in required_skills else "Medium"
        keywords.append({
            "keyword": skill,
            "count": count,
            "importance": importance,
        })

    return {
        "roleTitle": detected_title,
        "company": provided_company or "Target Company",
        "requiredSkills": required_skills,
        "preferredSkills": preferred_skills,
        "experienceYearsRequired": years_required,
        "qualifications": qualifications,
        "responsibilities": responsibilities[:8],
        "keywords": keywords,
    }
