import re
from typing import Dict, List, Optional, Any, Set, Tuple
from app.services.skill_normalization import normalize_skill_name, SKILL_ALIASES, SKILL_TAXONOMY


# Section markers for Job Descriptions
REQUIRED_SECTION_PATTERNS = [
    r"(?:minimum|required|basic)\s+qualifications",
    r"(?:core|mandatory|key)\s+requirements",
    r"requirements",
    r"what\s+you(?:'ll)?\s+need",
    r"what\s+you\s+bring",
    r"must[\s-]haves?",
    r"who\s+you\s+are",
    r"skills\s+&\s+experience",
    r"what\s+we(?:'re|\s+are)\s+looking\s+for",
]

PREFERRED_SECTION_PATTERNS = [
    r"preferred\s+qualifications",
    r"preferred\s+skills",
    r"nice[\s-]to[\s-]haves?",
    r"bonus\s+(?:points|qualifications)",
    r"bonus",
    r"plus(?:\s+points)?",
    r"desired\s+skills",
    r"what\s+would\s+be\s+great",
    r"additional\s+qualifications",
]

RESPONSIBILITY_PATTERNS = [
    r"responsibilities",
    r"what\s+you(?:'ll)?\s+do",
    r"key\s+responsibilities",
    r"duties",
    r"the\s+role",
    r"about\s+the\s+role",
]

EXPERIENCE_REGEX = re.compile(
    r"(\b\d{1,2}(?:\s*(?:-|to|\+)\s*\d{1,2})?\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+(?:relevant|hands-on|professional|software|engineering|industry|embedded|hardware|clinical|nursing))?\s+experience\b)",
    re.IGNORECASE,
)

DEGREE_REGEX = re.compile(
    r"(?:bachelor'?s?|master'?s?|ph\.?d\.?|b\.?s\.?|m\.?s\.?|b\.?e\.?|b\.?tech\.?|m\.?tech\.?|b\.?s\.?n\.?|m\.?s\.?n\.?|r\.?n\.?|degree)\s+(?:in|of)\s+[a-zA-Z\s,]+(?:computer\s+science|engineering|electrical|nursing|healthcare|clinical|information\s+technology|related\s+field|equivalent)",
    re.IGNORECASE,
)

TITLE_PATTERNS = [
    re.compile(r"^(?:position|role|job\s+title)\s*:\s*([^\n\r]+)", re.IGNORECASE),
    re.compile(r"(?:we(?:'re|\s+are)\s+looking\s+for\s+(?:a|an)\s+)([A-Z][a-zA-Z0-9\s/]+(?:Engineer|Developer|Architect|Manager|Lead|Specialist|Scientist|Intern|Nurse|Practitioner|Accountant))", re.IGNORECASE),
]

NEGATION_REGEX = re.compile(
    r"\b(?:not|no|don't|do\s+not|without|avoid|exclude)\s+[^.\n;]*",
    re.IGNORECASE,
)

DOMAIN_CLASSIFICATION_RULES = [
    (re.compile(r"\b(?:nurse|nursing|rn|bsn|clinical|icu|patient\s+care|hospital|healthcare|triage|medical)\b", re.IGNORECASE), "Healthcare / Nursing"),
    (re.compile(r"\b(?:software|engineer|developer|frontend|backend|full[\s-]stack|devops|cloud|data|embedded|firmware|hardware|fpga|web)\b", re.IGNORECASE), "Software / Technology"),
    (re.compile(r"\b(?:accountant|cpa|auditor|financial|bookkeeper|tax)\b", re.IGNORECASE), "Finance / Accounting"),
    (re.compile(r"\b(?:attorney|lawyer|paralegal|legal\s+counsel)\b", re.IGNORECASE), "Legal"),
]

DOMAIN_KEYWORD_PATTERNS: List[Tuple[str, str, str]] = [
    ("Architecture & System Design", r"\b(?:architect(?:ure|ed)?|system\s+design|frontend\s+architecture)\b", "High"),
    ("CI/CD & Automation", r"\b(?:ci[\s/]*cd|continuous\s+integration|automation|deployment\s+pipelines?)\b", "High"),
    ("Scalability & Performance", r"\b(?:scalab(?:le|ility)|high[\s-]throughput|performance|latency)\b", "High"),
    ("API Design & Contracts", r"\b(?:api\s+contracts?|api\s+design|rest\s+apis?|endpoints?)\b", "Medium"),
    ("Automated Testing & QA", r"\b(?:automated\s+tests?|unit\s+test(?:ing|s)?|end[\s-]to[\s-]end|e2e)\b", "Medium"),
    ("Distributed Systems", r"\bdistributed\s+systems?\b", "High"),
    ("Microservices Architecture", r"\bmicroservices?\b", "High"),
    ("High Availability", r"\bhigh\s+availability\b", "High"),
    ("Fault Tolerance", r"\bfault\s+toleran(?:ce|t)\b", "Medium"),
    ("Real-Time Systems", r"\breal[\s-]time(?:\s+systems?)?\b", "High"),
    ("Concurrency & Multithreading", r"\b(?:concurrency|multithread(?:ing|ed))\b", "High"),
    ("Signal Integrity", r"\bsignal\s+integrity\b", "High"),
    ("Hardware-Software Co-Design", r"\bhardware[\s-]software\b", "High"),
    ("Board Bring-up", r"\bboard\s+bring[\s-]up\b", "High"),
    ("Firmware Architecture", r"\bfirmware\b", "High"),
    ("RTOS Scheduling", r"\brtos\b", "High"),
    ("Agile / Scrum Methodology", r"\b(?:agile|scrum)\b", "Medium"),
    ("Security Best Practices", r"\b(?:security|owasp|cryptography)\b", "Medium"),
    ("Memory Management", r"\bmemory\s+management\b", "High"),
    # Clinical / Healthcare domain patterns
    ("Patient Care & Clinical Workflow", r"\b(?:patient\s+care|clinical\s+assessment|triage|vital\s+signs)\b", "High"),
    ("Medication Administration", r"\b(?:medication\s+administration|iv\s+therapy|pharmacology)\b", "High"),
    ("Electronic Health Records (EHR)", r"\b(?:emr|ehr|electronic\s+medical\s+records?|epic|cerner)\b", "Medium"),
]


def extract_skills_from_str(text: str) -> Dict[str, int]:
    """
    Extracts canonical skills from a text block with boundary-aware matching,
    filtering out skills mentioned in negative / anti-pattern contexts.
    """
    found: Dict[str, int] = {}
    if not text:
        return found

    # Remove negated clauses so anti-patterns are not extracted as requirements
    cleaned_lines = []
    for line in text.split("\n"):
        negated_line = NEGATION_REGEX.sub("", line)
        cleaned_lines.append(negated_line)
    text_to_scan = "\n".join(cleaned_lines)

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

        matches = list(re.finditer(pattern, text_to_scan, re.IGNORECASE))
        if matches:
            found[canonical] = found.get(canonical, 0) + len(matches)

    return found


def extract_clean_requirement_phrases(lines: List[str]) -> List[str]:
    """
    Extracts clean qualification phrases directly from bullet points for any domain
    (e.g. Registered Nurse, Legal, Finance, or Engineering).
    """
    extracted: List[str] = []
    for line in lines:
        clean = re.sub(r"^[-*•\d\.]+\s*", "", line).strip()
        if len(clean) < 10 or len(clean) > 120:
            continue
        # Skip section titles or generic headers
        if re.search(r"^(?:minimum|basic|required|what\s+you|responsibilities)", clean, re.IGNORECASE):
            continue
        # Truncate at sentence period if multi-sentence
        first_sentence = clean.split(".")[0].strip()
        if 8 < len(first_sentence) < 85:
            extracted.append(first_sentence)
    return extracted[:8]


def detect_disjunctive_skill_clusters(text: str) -> List[Dict[str, Any]]:
    """
    Detects disjunctive 'OR' requirements (e.g. 'AWS, GCP, or Azure' / 'Python or Go')
    so candidates who satisfy any one alternative receive full credit.
    """
    clusters: List[Dict[str, Any]] = []
    seen_cluster_names = set()

    for line in text.split("\n"):
        line_lower = line.lower()
        if " or " in line_lower or "and/or" in line_lower:
            line_skills: List[str] = []
            for alias, canon in SKILL_ALIASES.items():
                pattern = r"(?<![a-zA-Z0-9])" + re.escape(alias) + r"(?![a-zA-Z0-9])"
                if re.search(pattern, line_lower):
                    if canon not in line_skills:
                        line_skills.append(canon)
            if len(line_skills) >= 2:
                c_name = " / ".join(line_skills)
                if c_name not in seen_cluster_names:
                    seen_cluster_names.add(c_name)
                    clusters.append({
                        "clusterName": c_name,
                        "options": line_skills,
                    })
    return clusters


def parse_job_description(
    raw_text: str,
    provided_title: Optional[str] = None,
    provided_company: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Parses a raw job description string and returns structured requirements for ANY domain:
    - roleTitle
    - company
    - jdDomain (e.g. Healthcare / Nursing, Software / Technology)
    - requiredSkills (mandatory qualifications)
    - preferredSkills (bonus qualifications, empty if not specified in JD)
    - alternativeRequirementClusters (disjunctive OR requirements)
    - experienceYearsRequired
    - experienceMinYears (numeric float)
    - qualifications (degrees & certifications)
    - responsibilities
    - keywords (distinct domain concepts)
    """
    if not raw_text or len(raw_text.strip()) == 0:
        return {
            "roleTitle": provided_title or "Untitled Role",
            "company": provided_company or "Target Company",
            "jdDomain": "General",
            "requiredSkills": [],
            "preferredSkills": [],
            "alternativeRequirementClusters": [],
            "experienceYearsRequired": "Not specified",
            "experienceMinYears": 0.0,
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

        if not detected_title and len(lines) > 0:
            first_line = lines[0].strip()
            if 5 < len(first_line) < 60 and not any(c in first_line for c in [":", "http", "."]):
                detected_title = first_line

    if not detected_title:
        # Check text for domain clues before defaulting
        if re.search(r"\b(?:nurse|nursing|rn|clinical|hospital)\b", raw_text, re.IGNORECASE):
            detected_title = "Registered Nurse"
        else:
            detected_title = "Software Engineer"

    # 2. Classify Job Domain
    jd_domain = "General"
    title_and_text = (detected_title + " " + raw_text[:800]).lower()
    for rule_regex, domain_name in DOMAIN_CLASSIFICATION_RULES:
        if rule_regex.search(title_and_text):
            jd_domain = domain_name
            break

    # 3. Segment JD into sections
    current_sec = "intro"
    has_explicit_preferred_section = False
    has_explicit_required_section = False

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
        if len(line_clean) < 55:
            matched_sec = None
            for pat in PREFERRED_SECTION_PATTERNS:
                if re.search(pat, line_clean):
                    matched_sec = "preferred"
                    has_explicit_preferred_section = True
                    break
            if not matched_sec:
                for pat in REQUIRED_SECTION_PATTERNS:
                    if re.search(pat, line_clean):
                        matched_sec = "required"
                        has_explicit_required_section = True
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
    full_text = raw_text

    # 4. Extract Years of Experience
    exp_matches_req = EXPERIENCE_REGEX.findall(req_text)
    exp_matches_full = EXPERIENCE_REGEX.findall(full_text)
    exp_matches = exp_matches_req if exp_matches_req else exp_matches_full

    years_required = "Not specified"
    min_years_num = 0.0

    if exp_matches:
        years_required = exp_matches[0].strip()
        m_num = re.search(r"(\d+)(?:\s*(?:-|to)\s*(\d+))?", years_required)
        if m_num:
            min_years_num = float(m_num.group(1))

    # 5. Extract Degree Qualifications
    degree_matches = DEGREE_REGEX.findall(full_text)
    qualifications = [d.strip() for d in degree_matches]

    # 6. Extract Required vs Preferred Skills (Open-Domain Fallback)
    req_skills_map = extract_skills_from_str(req_text)
    pref_skills_map = extract_skills_from_str(pref_text)
    all_skills_map = extract_skills_from_str(full_text)

    required_skills: List[str] = []
    preferred_skills: List[str] = []

    if has_explicit_required_section and req_skills_map:
        for skill in req_skills_map:
            required_skills.append(skill)
    elif all_skills_map:
        for skill in all_skills_map:
            required_skills.append(skill)

    # OPEN-DOMAIN REQUIREMENT FALLBACK:
    # If no pre-defined technical taxonomy skills were found (e.g. Nurse, Healthcare, Accounting),
    # extract the actual required qualification bullets from the JD text!
    if not required_skills and segmented["required"]:
        bullet_reqs = extract_clean_requirement_phrases(segmented["required"])
        if bullet_reqs:
            required_skills = bullet_reqs

    # If still empty, check full text for bullet points in intro/other
    if not required_skills and lines:
        bullet_reqs = extract_clean_requirement_phrases(lines)
        if bullet_reqs:
            required_skills = bullet_reqs[:6]

    # Preferred skills
    if has_explicit_preferred_section and pref_skills_map:
        for skill in pref_skills_map:
            if skill not in required_skills:
                preferred_skills.append(skill)
    elif has_explicit_preferred_section and segmented["preferred"]:
        bullet_prefs = extract_clean_requirement_phrases(segmented["preferred"])
        for bp in bullet_prefs:
            if bp not in required_skills:
                preferred_skills.append(bp)

    # 7. Disjunctive 'OR' Clusters
    disjunctive_clusters = detect_disjunctive_skill_clusters(req_text or full_text)

    # 8. Responsibilities
    responsibilities = []
    if segmented["responsibilities"]:
        for r_line in segmented["responsibilities"]:
            clean_r = re.sub(r"^[-*•\d\.]+\s*", "", r_line).strip()
            if len(clean_r) > 20:
                responsibilities.append(clean_r)

    # 9. Extract Distinct Domain Keywords
    skill_names_lower = {s.lower() for s in (required_skills + preferred_skills)}
    keywords: List[Dict[str, Any]] = []

    for kw_title, kw_pattern, importance in DOMAIN_KEYWORD_PATTERNS:
        if kw_title.lower() in skill_names_lower:
            continue
        matches = list(re.finditer(kw_pattern, full_text, re.IGNORECASE))
        if matches:
            keywords.append({
                "keyword": kw_title,
                "pattern": kw_pattern,
                "count": len(matches),
                "importance": importance,
            })

    return {
        "roleTitle": detected_title,
        "company": provided_company or "Target Company",
        "jdDomain": jd_domain,
        "requiredSkills": required_skills,
        "preferredSkills": preferred_skills,
        "alternativeRequirementClusters": disjunctive_clusters,
        "experienceYearsRequired": years_required,
        "experienceMinYears": min_years_num,
        "qualifications": qualifications,
        "responsibilities": responsibilities[:8],
        "keywords": keywords,
    }
