import re
from typing import Dict, List, Optional, Any, Set, Tuple
from app.services.skill_normalization import normalize_skill_name, SKILL_ALIASES, SKILL_TAXONOMY


# Section markers for Job Descriptions
REQUIRED_SECTION_PATTERNS = [
    r"(?:minimum|required|basic)\s+qualifications",
    r"^qualifications",
    r"(?:core|mandatory|key)\s+requirements",
    r"^requirements",
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

EXPERIENCE_REGEXES = [
    # 5-8 years of embedded hardware experience / 5-8 years of experience / 5–8 years experience / 5+ years
    re.compile(
        r"(\b\d{1,2}(?:\s*(?:[\-–—]|to)\s*\d{1,2})?\+?\s*(?:years?|yrs?|\'years?|years\')(?:(?:\s+of)?(?:\s+[\w\s\-/]{1,35})?\s+experience|\s+in\s+[\w\s\-/]{1,35}|\b))",
        re.IGNORECASE,
    ),
    # Experience: 5-8 years
    re.compile(
        r"(?:experience\s*:\s*)(\b\d{1,2}(?:\s*(?:[\-–—]|to)\s*\d{1,2})?\+?\s*(?:years?|yrs?)\b)",
        re.IGNORECASE,
    ),
    # Minimum 5 years / Requires 5-8 years
    re.compile(
        r"(?:minimum|min\.?|at\s+least|requires?)\s+(\b\d{1,2}(?:\s*(?:[\-–—]|to)\s*\d{1,2})?\+?\s*(?:years?|yrs?)(?:\s+of\s+[\w\s\-/]{1,25})?\b)",
        re.IGNORECASE,
    ),
]

DEGREE_REGEX = re.compile(
    r"(?:bachelor'?s?|master'?s?|ph\.?d\.?|b\.?s\.?|m\.?s\.?|b\.?e\.?|b\.?tech\.?|m\.?tech\.?|b\.?s\.?n\.?|m\.?s\.?n\.?|r\.?n\.?|degree)\s+(?:in|of)?\s+[a-zA-Z\s,]+(?:computer\s+science|software\s+engineering|electrical\s+engineering|electronics|computer\s+engineering|hardware\s+engineering|nursing|healthcare|clinical|information\s+technology|related\s+field|equivalent)",
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
    (re.compile(r"\b(?:embedded|firmware|hardware|fpga|asic|pcb|soc|vlsi|verilog|vhdl|circuit|microcontroller)\b", re.IGNORECASE), "Embedded / Hardware Systems"),
    (re.compile(r"\b(?:software|engineer|developer|frontend|backend|full[\s-]stack|devops|cloud|data|web)\b", re.IGNORECASE), "Software / Technology"),
    (re.compile(r"\b(?:accountant|cpa|auditor|financial|bookkeeper|tax)\b", re.IGNORECASE), "Finance / Accounting"),
    (re.compile(r"\b(?:attorney|lawyer|paralegal|legal\s+counsel)\b", re.IGNORECASE), "Legal"),
]

DOMAIN_KEYWORD_PATTERNS: List[Tuple[str, str, str]] = [
    # General Software & Web
    ("Software Architecture & System Design", r"\b(?:software\s+architecture|distributed\s+systems?\s+design|microservices?\s+architecture|cloud\s+architecture)\b", "High"),
    ("Frontend & UI Architecture", r"\b(?:frontend\s+architecture|ui\s+architecture|component\s+architecture)\b", "Medium"),
    ("CI/CD & Deployment Pipelines", r"\b(?:ci[\s/]*cd|continuous\s+integration|deployment\s+pipelines?)\b", "High"),
    ("Scalability & High-Throughput", r"\b(?:scalab(?:le|ility)|high[\s-]throughput|latency\s+optimization)\b", "High"),
    ("API Design & Contracts", r"\b(?:api\s+contracts?|api\s+design|rest\s+apis?|endpoints?)\b", "Medium"),
    ("Software Automated Testing & QA", r"\b(?:automated\s+unit\s+tests?|end[\s-]to[\s-]end\s+testing|e2e\s+testing)\b", "Medium"),
    ("Distributed Systems", r"\bdistributed\s+systems?\b", "High"),
    ("High Availability & Fault Tolerance", r"\b(?:high\s+availability|fault\s+toleran(?:ce|t))\b", "High"),
    
    # Embedded & Hardware Systems (Clearly distinguished from web software)
    ("Hardware Board Bring-up & Architecture", r"\b(?:hardware\s+board\s+bring[\s-]up|board\s+bring[\s-]up|hardware\s+architecture|schematic\s+capture)\b", "High"),
    ("Embedded Firmware & Bare-Metal Design", r"\b(?:firmware\s+development|bare[\s-]metal|microcontroller\s+firmware|device\s+drivers?)\b", "High"),
    ("Hardware Verification & Bench Debugging", r"\b(?:oscilloscope|logic\s+analyzer|hardware\s+debugging|protocol\s+analyzer|multimeter)\b", "High"),
    ("Signal Integrity & Power Analysis", r"\b(?:signal\s+integrity|power\s+management\s+optimization|timing\s+analysis)\b", "High"),
    ("Hardware-Software Co-Design", r"\bhardware[\s-]software\s+co[\s-]design\b", "High"),
    ("RTOS Scheduling & Concurrency", r"\b(?:rtos\s+scheduling|real[\s-]time\s+operating\s+systems?)\b", "High"),
    
    # Security, Concurrency, and Clinical
    ("Security Best Practices & OWASP", r"\b(?:security\s+best\s+practices|owasp|cryptography)\b", "Medium"),
    ("Concurrency & Multithreading", r"\b(?:multithread(?:ing|ed)|thread\s+safety)\b", "High"),
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
    years_required = "Not specified"
    min_years_num = 0.0

    def extract_years_from_block(text_block: str) -> Optional[Tuple[str, float]]:
        if not text_block:
            return None
        for rx in EXPERIENCE_REGEXES:
            matches = rx.findall(text_block)
            if matches:
                cand = matches[0].strip() if isinstance(matches[0], str) else matches[0][0].strip()
                cand_clean = re.sub(r"\s+", " ", cand).strip()
                m_num = re.search(r"(\d+)(?:\s*(?:[\-–—]|to)\s*(\d+))?", cand_clean)
                if m_num:
                    min_v = float(m_num.group(1))
                    if 0 < min_v <= 30:
                        return cand_clean, min_v
        return None

    exp_found = extract_years_from_block(req_text) or extract_years_from_block(full_text)
    if exp_found:
        years_required = exp_found[0]
        min_years_num = exp_found[1]

    # 5. Extract Degree Qualifications & Accepted Disciplines
    degree_matches = DEGREE_REGEX.findall(full_text)
    qualifications = [d.strip() for d in degree_matches]

    is_degree_mandatory = len(DEGREE_REGEX.findall(req_text)) > 0 or bool(
        re.search(r"\b(?:bachelor'?s?|master'?s?|degree|b\.?s\.?|b\.?e\.?|b\.?tech)\b", req_text, re.IGNORECASE)
    )

    accepted_disciplines: List[str] = []
    if re.search(r"\b(?:electrical\s+engineering|electronics|bsee|msee|hardware\s+engineering)\b", full_text, re.IGNORECASE):
        accepted_disciplines.append("hardware_engineering")
    if re.search(r"\b(?:computer\s+engineering)\b", full_text, re.IGNORECASE):
        accepted_disciplines.append("computer_engineering")
    if re.search(r"\b(?:computer\s+science|software\s+engineering|information\s+technology|bscs|mscs)\b", full_text, re.IGNORECASE):
        accepted_disciplines.append("software_cs")
    if re.search(r"\b(?:nursing|bsn|msn|registered\s+nurse|healthcare|clinical)\b", full_text, re.IGNORECASE):
        accepted_disciplines.append("healthcare")
    if re.search(r"\b(?:accounting|finance|business|mba)\b", full_text, re.IGNORECASE):
        accepted_disciplines.append("business")
    if re.search(r"\b(?:related\s+(?:engineering|technical|scientific|field|discipline)|equivalent)\b", full_text, re.IGNORECASE):
        accepted_disciplines.append("related_field")

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
        "acceptedDisciplines": accepted_disciplines,
        "isDegreeMandatory": is_degree_mandatory,
        "responsibilities": responsibilities[:8],
        "keywords": keywords,
    }
