import re
from typing import Dict, List, Optional, Any, Set, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from app.services.skill_normalization import normalize_skill_name, SKILL_TAXONOMY, SKILL_ALIASES

# Curated related ecosystem graph (Skill A -> Set of Related Skills & relationship weights)
RELATED_ECOSYSTEM_MAP: Dict[str, Dict[str, float]] = {
    "React": {"Next.js": 0.88, "Redux": 0.82, "TypeScript": 0.75, "Vue.js": 0.70},
    "Next.js": {"React": 0.90, "Vite": 0.72, "TypeScript": 0.80},
    "TypeScript": {"JavaScript": 0.92, "React": 0.75, "Node.js": 0.75},
    "JavaScript": {"TypeScript": 0.85, "React": 0.80, "Node.js": 0.80},
    "Node.js": {"Express.js": 0.90, "JavaScript": 0.85, "TypeScript": 0.80, "FastAPI": 0.68},
    "Express.js": {"Node.js": 0.92, "REST APIs": 0.88, "FastAPI": 0.70},
    "FastAPI": {"Python": 0.92, "Flask": 0.85, "Django": 0.80, "REST APIs": 0.88},
    "Django": {"Python": 0.92, "FastAPI": 0.80, "Flask": 0.82},
    "PostgreSQL": {"SQL": 0.95, "MySQL": 0.85, "MongoDB": 0.65},
    "MySQL": {"SQL": 0.95, "PostgreSQL": 0.85},
    "MongoDB": {"PostgreSQL": 0.65, "Redis": 0.68},
    "Docker": {"Kubernetes": 0.85, "CI/CD": 0.78, "Linux": 0.75},
    "Kubernetes": {"Docker": 0.88, "DevOps": 0.85, "Cloud": 0.80},
    "AWS": {"GCP": 0.80, "Azure": 0.80, "Docker": 0.72},
    "GCP": {"AWS": 0.80, "Azure": 0.80},
    "Azure": {"AWS": 0.80, "GCP": 0.80},
    "Jest": {"Unit Testing": 0.95, "PyTest": 0.75, "Cypress": 0.72},
    "PyTest": {"Unit Testing": 0.95, "Jest": 0.75},
    "Cypress": {"Playwright": 0.88, "E2E Testing": 0.95, "Jest": 0.70},
    "Playwright": {"Cypress": 0.88, "E2E Testing": 0.95},
    "Tailwind CSS": {"CSS3": 0.90, "Responsive Design": 0.85},
    "GraphQL": {"REST APIs": 0.78, "Backend": 0.75},
    "REST APIs": {"GraphQL": 0.78, "Microservices": 0.82},
}


class SemanticMatcher:
    """
    Hybrid skill matching engine combining exact canonical normalization,
    alias expansion, domain ecosystem relationships, and TF-IDF cosine similarity.
    """

    def __init__(self):
        # Character & word n-gram TF-IDF vectorizer for robust semantic similarity on technical phrases
        self.vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            lowercase=True,
        )

    def calculate_text_similarity(self, text_a: str, text_b: str) -> float:
        """
        Computes n-gram TF-IDF cosine similarity between two technical terms or sentences.
        """
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
        Evaluates candidate resume skills against required and preferred job qualifications.
        Categorizes each into:
        - matchedSkills
        - partiallyMatchedSkills
        - missingSkills
        - uncertainSkills
        """
        # Index candidate skills by canonical name
        candidate_skills_map: Dict[str, Dict[str, Any]] = {
            s["name"]: s for s in resume_skills
        }

        matched_skills: List[Dict[str, Any]] = []
        partially_matched_skills: List[Dict[str, Any]] = []
        missing_skills: List[Dict[str, Any]] = []
        uncertain_skills: List[Dict[str, Any]] = []

        all_target_requirements: List[Tuple[str, str]] = [
            (req, "High") for req in required_skills
        ] + [
            (pref, "Medium") for pref in preferred_skills
        ]

        evaluated_canonicals: Set[str] = set()

        for req_raw, priority in all_target_requirements:
            canon_req, req_cat = normalize_skill_name(req_raw)
            if not canon_req or canon_req in evaluated_canonicals:
                continue
            evaluated_canonicals.add(canon_req)

            # 1. Exact canonical match
            if canon_req in candidate_skills_map:
                cand = candidate_skills_map[canon_req]
                matched_skills.append({
                    "name": canon_req,
                    "category": cand.get("category", req_cat),
                    "level": cand.get("level", "Proficient"),
                    "confidence": cand.get("confidence", 92),
                    "evidence": cand.get("evidence"),
                })
                continue

            # 2. Check for Alias match
            found_via_alias = False
            for alias_term, mapped_canon in SKILL_ALIASES.items():
                if mapped_canon == canon_req and alias_term in candidate_skills_map:
                    cand = candidate_skills_map[alias_term]
                    matched_skills.append({
                        "name": canon_req,
                        "category": cand.get("category", req_cat),
                        "level": cand.get("level", "Proficient"),
                        "confidence": 90,
                        "evidence": cand.get("evidence"),
                    })
                    found_via_alias = True
                    break

            if found_via_alias:
                continue

            # 3. Check for Semantic / Related Ecosystem match
            best_related_skill = None
            best_rel_score = 0.0

            # Check ecosystem map
            if canon_req in RELATED_ECOSYSTEM_MAP:
                for rel_candidate, weight in RELATED_ECOSYSTEM_MAP[canon_req].items():
                    if rel_candidate in candidate_skills_map:
                        if weight > best_rel_score:
                            best_rel_score = weight
                            best_related_skill = rel_candidate

            # If not in ecosystem map, check TF-IDF n-gram similarity against all candidate skills
            if not best_related_skill:
                for c_name in candidate_skills_map:
                    sim = self.calculate_text_similarity(canon_req, c_name)
                    if sim > best_rel_score:
                        best_rel_score = sim
                        best_related_skill = c_name

            # Evaluate match quality
            if best_related_skill and best_rel_score >= 0.72:
                cand = candidate_skills_map[best_related_skill]
                conf = int(min(84, best_rel_score * 90))
                partially_matched_skills.append({
                    "name": canon_req,
                    "category": req_cat,
                    "matchBasis": f"Demonstrated adjacent capability in {best_related_skill} ({int(best_rel_score*100)}% alignment)",
                    "confidence": conf,
                    "evidence": cand.get("evidence"),
                    "explanation": (
                        f"Candidate demonstrates hands-on experience with {best_related_skill}, "
                        f"which shares underlying architectural principles with {canon_req}."
                    ),
                })
            elif best_related_skill and best_rel_score >= 0.48:
                uncertain_skills.append({
                    "name": canon_req,
                    "reason": f"Partial relevance observed via {best_related_skill}, but specific experience with {canon_req} is not explicitly verified.",
                    "context": f"Mentioned in job description under {priority.lower()} requirements.",
                })
            else:
                # Missing skill
                missing_skills.append({
                    "name": canon_req,
                    "category": req_cat,
                    "priority": priority,
                    "context": f"Identified as a {priority.lower()}-priority requirement for the position.",
                })

        # Also add any top skills the candidate has that exceed requirements to matchedSkills
        # to acknowledge strong candidate strengths
        for c_name, cand in candidate_skills_map.items():
            if c_name not in evaluated_canonicals and len(matched_skills) < 14:
                # Add as an additional matched candidate skill
                matched_skills.append({
                    "name": c_name,
                    "category": cand.get("category", "General"),
                    "level": cand.get("level", "Proficient"),
                    "confidence": cand.get("confidence", 85),
                    "evidence": cand.get("evidence"),
                })
                evaluated_canonicals.add(c_name)

        # Summary computation
        total_identified = len(matched_skills) + len(partially_matched_skills) + len(missing_skills)
        matched_count = len(matched_skills)
        missing_count = len(missing_skills)
        match_percentage = int((matched_count / total_identified * 100)) if total_identified > 0 else 0

        return {
            "matchedSkills": matched_skills,
            "partiallyMatchedSkills": partially_matched_skills,
            "missingSkills": missing_skills,
            "uncertainSkills": uncertain_skills,
            "skillMatchSummary": {
                "totalIdentified": total_identified,
                "matchedCount": matched_count,
                "missingCount": missing_count,
                "percentage": match_percentage,
            },
        }


matcher_service = SemanticMatcher()
