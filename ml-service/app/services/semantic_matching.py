import re
from typing import Dict, List, Optional, Any, Set, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.skill_normalization import normalize_skill_name, SKILL_TAXONOMY, SKILL_ALIASES

# Curated genuine hierarchical & direct extension ecosystem graph.
# Direction: Target Requirement -> Candidate Skill that provides genuine evidence for the requirement.
# Rule: Only include genuine superset / direct foundation relationships.
# Do NOT include competing frameworks (React != Vue, PostgreSQL != MySQL).
# Do NOT infer embedded/hardware from generic web or high-level languages.
RELATED_ECOSYSTEM_MAP: Dict[str, Dict[str, float]] = {
    # If job requires React, having Next.js is direct evidence of React mastery
    "React": {"Next.js": 0.85, "Redux": 0.78},
    
    # If job requires JavaScript, having TypeScript demonstrates JavaScript competence
    "JavaScript": {"TypeScript": 0.88},
    
    # If job requires REST APIs, framework-level API engineering demonstrates competence
    "REST APIs": {"Express.js": 0.80, "FastAPI": 0.80, "Django": 0.80, "Spring Boot": 0.80},
    
    # Testing hierarchies
    "Unit Testing": {"Jest": 0.90, "PyTest": 0.90, "Mocha": 0.85},
    "E2E Testing": {"Playwright": 0.90, "Cypress": 0.90, "Selenium": 0.85},
    
    # Styling
    "CSS3": {"Tailwind CSS": 0.85},
    
    # Embedded & Hardware genuine hierarchical relationships
    "Verilog": {"SystemVerilog": 0.85},
    "RTOS": {"FreeRTOS": 0.90},
    "Hardware Debugging": {"Oscilloscope": 0.85, "Logic Analyzer": 0.85},
    "Microcontrollers": {"ARM Architecture": 0.82},
}

# Strict negative pairs: technologies that must NEVER be treated as equivalents or partial substitutes
DISALLOWED_EQUIVALENCES: Set[Tuple[str, str]] = {
    ("React", "Vue.js"),
    ("Vue.js", "React"),
    ("PostgreSQL", "MySQL"),
    ("MySQL", "PostgreSQL"),
    ("MongoDB", "PostgreSQL"),
    ("PostgreSQL", "MongoDB"),
    ("FastAPI", "Node.js"),
    ("Node.js", "FastAPI"),
    ("C++", "Embedded C"),
    ("C", "Embedded C"),
    ("Python", "Embedded C"),
    ("JavaScript", "Embedded C"),
    ("React", "Embedded C"),
    ("Node.js", "Embedded C"),
    ("C++", "FPGA Development"),
    ("React", "FPGA Development"),
    ("Python", "VHDL"),
    ("C++", "VHDL"),
    ("Python", "Verilog"),
    ("C++", "Verilog"),
    ("JavaScript", "PCB Design"),
    ("Python", "PCB Design"),
    ("C++", "PCB Design"),
    ("React", "Hardware Debugging"),
}


class SemanticMatcher:
    """
    Evidence-based hybrid skill matching engine combining exact canonical normalization,
    explicit alias expansion, curated hierarchical ecosystem graphs, and strict semantic validation.
    Prevents false equivalences across distinct technologies and engineering domains.
    """

    def __init__(self):
        # Character & word n-gram TF-IDF vectorizer for phrase similarity validation
        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            lowercase=True,
        )

    def calculate_text_similarity(self, text_a: str, text_b: str) -> float:
        """Computes n-gram TF-IDF cosine similarity between two technical terms."""
        if not text_a or not text_b:
            return 0.0
        if text_a.strip().lower() == text_b.strip().lower():
            return 1.0

        try:
            tfidf = self.vectorizer.fit_transform([text_a, text_b])
            sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
            return float(sim)
        except Exception:
            return 0.0

    def match_requirements(
        self,
        resume_skills: List[Dict[str, Any]],
        required_skills: List[str],
        preferred_skills: List[str],
        resume_text: str,
        jd_text: str,
    ) -> Dict[str, Any]:
        """
        Evaluates candidate resume skills against target job requirements.
        Categorizes each into:
        - matchedSkills: Exact or alias verified matches with target requirements.
        - partiallyMatchedSkills: Genuine hierarchical/ecosystem relationships with verified candidate evidence.
        - missingSkills: Target qualifications absent from candidate profile.
        - uncertainSkills: Textually similar terms requiring recruiter review without awarding automatic credit.
        """
        # Index candidate skills by canonical name and lowercase
        candidate_skills_map: Dict[str, Dict[str, Any]] = {}
        for s in resume_skills:
            c_name, c_cat = normalize_skill_name(s.get("name", ""))
            if c_name:
                candidate_skills_map[c_name] = s
                candidate_skills_map[c_name.lower()] = s

        matched_skills: List[Dict[str, Any]] = []
        partially_matched_skills: List[Dict[str, Any]] = []
        missing_skills: List[Dict[str, Any]] = []
        uncertain_skills: List[Dict[str, Any]] = []

        all_target_requirements: List[Tuple[str, str, bool]] = [
            (req, "High", True) for req in required_skills
        ] + [
            (pref, "Medium", False) for pref in preferred_skills
        ]

        evaluated_canonicals: Set[str] = set()

        for req_raw, priority, is_required in all_target_requirements:
            canon_req, req_cat = normalize_skill_name(req_raw)
            if not canon_req or canon_req.lower() in evaluated_canonicals:
                continue
            evaluated_canonicals.add(canon_req.lower())

            # 1. Exact canonical match
            if canon_req in candidate_skills_map or canon_req.lower() in candidate_skills_map:
                cand = candidate_skills_map.get(canon_req) or candidate_skills_map.get(canon_req.lower())
                matched_skills.append({
                    "name": canon_req,
                    "category": cand.get("category", req_cat),
                    "level": cand.get("level", "Proficient"),
                    "confidence": cand.get("confidence", 95),
                    "evidence": cand.get("evidence"),
                    "isRequired": is_required,
                })
                continue

            # 2. Check for Alias match
            found_via_alias = False
            for alias_term, mapped_canon in SKILL_ALIASES.items():
                if mapped_canon.lower() == canon_req.lower() and (alias_term in candidate_skills_map or alias_term.lower() in candidate_skills_map):
                    cand = candidate_skills_map.get(alias_term) or candidate_skills_map.get(alias_term.lower())
                    matched_skills.append({
                        "name": canon_req,
                        "category": cand.get("category", req_cat),
                        "level": cand.get("level", "Proficient"),
                        "confidence": 92,
                        "evidence": cand.get("evidence"),
                        "isRequired": is_required,
                    })
                    found_via_alias = True
                    break

            if found_via_alias:
                continue

            # 3. Check Curated Hierarchical Ecosystem Match
            # (Candidate has skill X that directly demonstrates competency in required skill canon_req)
            best_related_skill = None
            best_rel_weight = 0.0

            if canon_req in RELATED_ECOSYSTEM_MAP:
                for candidate_rel, rel_weight in RELATED_ECOSYSTEM_MAP[canon_req].items():
                    if candidate_rel in candidate_skills_map or candidate_rel.lower() in candidate_skills_map:
                        # Ensure not in disallowed negative pairs
                        if (candidate_rel, canon_req) not in DISALLOWED_EQUIVALENCES and (canon_req, candidate_rel) not in DISALLOWED_EQUIVALENCES:
                            if rel_weight > best_rel_weight:
                                best_rel_weight = rel_weight
                                best_related_skill = candidate_rel

            if best_related_skill and best_rel_weight >= 0.75:
                cand = candidate_skills_map.get(best_related_skill) or candidate_skills_map.get(best_related_skill.lower())
                conf = int(round(best_rel_weight * 88))
                partially_matched_skills.append({
                    "name": canon_req,
                    "category": req_cat,
                    "matchBasis": f"Demonstrated competency in {best_related_skill} ({int(best_rel_weight*100)}% ecosystem alignment)",
                    "confidence": conf,
                    "evidence": cand.get("evidence") if cand else None,
                    "explanation": (
                        f"Candidate demonstrates verified proficiency with {best_related_skill}, "
                        f"which provides foundational architectural coverage for {canon_req}."
                    ),
                    "isRequired": is_required,
                })
                continue

            # 4. Check TF-IDF n-gram text similarity for potential uncertain matches
            # Do NOT grant automatic partial match points from character similarity alone!
            best_sim_skill = None
            best_sim_val = 0.0

            # Scan candidate skills within the same category only
            for c_name, cand_info in candidate_skills_map.items():
                if len(c_name) <= 2:
                    continue
                # Skip disallowed pairs
                if (c_name, canon_req) in DISALLOWED_EQUIVALENCES or (canon_req, c_name) in DISALLOWED_EQUIVALENCES:
                    continue
                # Category guard: never match hardware/embedded against web/languages
                cand_cat = cand_info.get("category", "")
                if req_cat in ["Embedded", "Hardware"] and cand_cat not in ["Embedded", "Hardware"]:
                    continue

                sim = self.calculate_text_similarity(canon_req, c_name)
                if sim > best_sim_val:
                    best_sim_val = sim
                    best_sim_skill = c_name

            if best_sim_skill and best_sim_val >= 0.82 and req_cat == candidate_skills_map[best_sim_skill].get("category"):
                uncertain_skills.append({
                    "name": canon_req,
                    "reason": f"High lexical similarity ({int(best_sim_val*100)}%) with candidate's '{best_sim_skill}', but distinct technical specification requires manual review.",
                    "context": f"Identified in job requirements ({priority.lower()} priority).",
                })
            else:
                # Missing requirement
                missing_skills.append({
                    "name": canon_req,
                    "category": req_cat,
                    "priority": priority,
                    "context": f"Target {priority.lower()}-priority qualification not identified in resume.",
                    "isRequired": is_required,
                })

        # CRITICAL FIX: Do NOT dump unrequested candidate skills into matchedSkills!
        # matchedSkills strictly represents qualifications required by the job posting.

        # Compute Summary
        total_targets = len(required_skills) + len(preferred_skills)
        matched_count = len(matched_skills)
        partial_count = len(partially_matched_skills)
        missing_count = len(missing_skills)

        if total_targets > 0:
            effective_matches = matched_count + (0.5 * partial_count)
            match_percentage = min(100, max(0, int(round((effective_matches / total_targets) * 100))))
        else:
            match_percentage = 0

        return {
            "matchedSkills": matched_skills,
            "partiallyMatchedSkills": partially_matched_skills,
            "missingSkills": missing_skills,
            "uncertainSkills": uncertain_skills,
            "skillMatchSummary": {
                "totalIdentified": total_targets,
                "matchedCount": matched_count,
                "missingCount": missing_count,
                "percentage": match_percentage,
            },
        }


matcher_service = SemanticMatcher()
