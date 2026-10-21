import re
from typing import Dict, List, Optional, Tuple, Any

# Standard section header regex patterns
SECTION_PATTERNS = {
    "experience": [
        r"^(?:work\s+)?experience",
        r"^professional\s+experience",
        r"^employment\s+history",
        r"^work\s+history",
        r"^career\s+history",
    ],
    "education": [
        r"^education(?:al\s+background)?",
        r"^academic\s+background",
        r"^degrees\s+and\s+education",
    ],
    "skills": [
        r"^(?:technical\s+|core\s+)?skills",
        r"^technical\s+competencies",
        r"^technologies(?:\s+and\s+tools)?",
        r"^tech\s+stack",
        r"^programming\s+languages",
        r"^tools\s+&\s+technologies",
    ],
    "projects": [
        r"^(?:key\s+|featured\s+|personal\s+|academic\s+)?projects",
        r"^portfolio",
    ],
    "certifications": [
        r"^(?:licenses\s+&\s+)?certifications",
        r"^credentials",
        r"^certificates",
    ],
    "summary": [
        r"^(?:professional\s+)?summary",
        r"^profile",
        r"^about\s+me",
        r"^career\s+objective",
        r"^objective",
    ],
}

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")
URL_REGEX = re.compile(r"https?://(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_+.~#?&/=]*")
LINKEDIN_REGEX = re.compile(r"linkedin\.com/in/[a-zA-Z0-9_-]+", re.IGNORECASE)
GITHUB_REGEX = re.compile(r"github\.com/[a-zA-Z0-9_-]+", re.IGNORECASE)


def clean_text(text: str) -> str:
    """
    Cleans raw text by normalizing whitespace, unicode bullets, hyphens, and quotes.
    """
    if not text:
        return ""
    
    # Replace various unicode bullets with standard hyphen bullet
    text = re.sub(r"[\u2022\u2023\u25E6\u2043\u2219\u25AA\u25CF\u25CB\u25A0\u25A1]", "\n- ", text)
    # Replace fancy quotes and apostrophes
    text = re.sub(r"[\u2018\u2019\u201A\u201B]", "'", text)
    text = re.sub(r"[\u201C\u201D\u201E\u201F]", '"', text)
    # Replace em/en dashes
    text = re.sub(r"[\u2013\u2014]", "-", text)
    # Replace multiple blank lines with max 2 newlines
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    
    return text.strip()


def segment_resume_sections(text: str) -> Dict[str, str]:
    """
    Segments resume text into canonical sections:
    - experience
    - education
    - skills
    - projects
    - certifications
    - summary
    - other (header/unclassified text)
    """
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {
        "header": [],
        "summary": [],
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
        "certifications": [],
        "other": [],
    }

    current_section = "header"

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        # Check if this line looks like a section header
        # Usually short (< 40 chars), may be uppercase or title case
        if len(line) < 45:
            normalized_line = re.sub(r"[:\-_#=*]+$", "", line).strip().lower()
            detected_sec: Optional[str] = None

            for sec_name, patterns in SECTION_PATTERNS.items():
                for pat in patterns:
                    if re.match(pat, normalized_line, re.IGNORECASE):
                        detected_sec = sec_name
                        break
                if detected_sec:
                    break

            if detected_sec:
                current_section = detected_sec
                continue

        sections[current_section].append(line)

    # Join lines back into text
    return {sec: "\n".join(content).strip() for sec, content in sections.items() if content}


def extract_bullet_points(section_text: str) -> List[str]:
    """
    Extracts individual bullet points or responsibility sentences from a section.
    """
    if not section_text:
        return []

    raw_bullets = re.split(r"\n\s*[-*•]\s*", "\n" + section_text)
    cleaned = []
    for b in raw_bullets:
        bullet = b.strip()
        # If bullet was just split by newline without bullet symbol, consider line by line
        if bullet:
            for sub_line in bullet.split("\n"):
                sub_clean = sub_line.strip()
                if len(sub_clean) > 15:  # meaningful sentence or bullet
                    cleaned.append(sub_clean)

    return cleaned if cleaned else [s.strip() for s in section_text.split("\n") if len(s.strip()) > 15]


def audit_document_structure(text: str) -> Dict[str, Any]:
    """
    Audits the structural ATS compatibility of a resume document.
    Checks contact elements, standard headings, and layout indicators.
    """
    cleaned = clean_text(text)
    word_count = len(cleaned.split())
    char_count = len(cleaned)

    has_email = bool(EMAIL_REGEX.search(cleaned))
    has_phone = bool(PHONE_REGEX.search(cleaned))
    has_linkedin = bool(LINKEDIN_REGEX.search(cleaned))
    has_github = bool(GITHUB_REGEX.search(cleaned))

    sections = segment_resume_sections(cleaned)
    detected_sections = [sec for sec, val in sections.items() if sec != "header" and sec != "other" and len(val) > 20]

    return {
        "wordCount": word_count,
        "charCount": char_count,
        "hasEmail": has_email,
        "hasPhone": has_phone,
        "hasLinkedIn": has_linkedin,
        "hasGitHub": has_github,
        "detectedSections": detected_sections,
        "sections": sections,
    }
