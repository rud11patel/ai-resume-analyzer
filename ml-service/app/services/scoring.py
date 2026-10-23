import re
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
    parsed_jd: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Computes a deterministic, explainable resume-to-job compatibility score between 0 and 100.
    
    Model Architecture:
      - Required Skills (w_base = 0.50): Non-negotiable technical requirements.
      - Relevant Experience & Projects (w_base = 0.25): Relevance-aware tenure, deliverables & seniority.
      - Education & Eligibility (w_base = 0.10): Baseline degrees, major alignment & certifications.
      - Preferred Skills (w_base = 0.10): Bonus qualifications (N/A when JD has no preferred section).
      - Role-Specific Alignment (w_base = 0.05): Domain concepts without double-counting skills.
      - ATS Formatting (w_base = 0.00): Evaluated independently; excluded from role compatibility.

    Normalization & Guardrails:
      - Proportional weight redistribution when dimensions are N/A (no free points).
      - Domain compatibility gate: Mismatched career fields (e.g. Software Engineer applying to Nurse)
        strictly zero out tenure, education, and skills.
      - Zero required skills matched strictly caps overall score at <= 5%.
    """
    word_count = structural_audit.get("wordCount", 0)
    if word_count < 25:
        return {
            "status": "insufficient_data",
            "overallScore": 0,
            "jobCompatibilityScore": 0,
            "atsFormattingScore": 20,
            "scoreLabel": "Low Match",
            "subScores": {
                "technicalSkills": 0,
                "experienceRelevance": 0,
                "atsFormatting": 20,
                "keywordDensity": 0,
            },
            "scoreBreakdown": {
                "components": [],
                "calculationFormula": "Score = 0 (Insufficient resume text provided)",
            },
            "warnings": ["Uploaded resume contains fewer than 25 words."],
            "explanation": "Uploaded resume text is too short or empty for meaningful ATS evaluation.",
        }

    warnings: List[str] = []

    # -------------------------------------------------------------
    # 0. Domain Compatibility Check
    # -------------------------------------------------------------
    jd_domain = parsed_jd.get("jdDomain", "General") if parsed_jd else "General"
    candidate_domain = experience_profile.get("candidateDomain", "Software / Technology")

    is_domain_mismatch = False
    if jd_domain == "Healthcare / Nursing" and candidate_domain != "Healthcare / Clinical":
        is_domain_mismatch = True
    elif jd_domain == "Software / Technology" and candidate_domain == "Healthcare / Clinical":
        is_domain_mismatch = True

    # -------------------------------------------------------------
    # 1. Required Skills Score (S_req)
    # -------------------------------------------------------------
    req_set = {r.lower() for r in required_skills}
    
    # Check disjunctive clusters (e.g. AWS or GCP or Azure)
    disjunctive_clusters = parsed_jd.get("alternativeRequirementClusters", []) if parsed_jd else []
    
    skill_to_cluster: Dict[str, int] = {}
    cluster_options_map: Dict[int, List[str]] = {}
    for c_idx, c in enumerate(disjunctive_clusters):
        opts = [o.lower() for o in c.get("options", [])]
        cluster_options_map[c_idx] = opts
        for opt in opts:
            skill_to_cluster[opt] = c_idx

    # Group required_skills into evaluation units (each cluster counts as 1 unit)
    standalone_reqs = [r for r in required_skills if r.lower() not in skill_to_cluster]
    active_clusters_in_req = {skill_to_cluster[r.lower()] for r in required_skills if r.lower() in skill_to_cluster}
    total_req_units = len(standalone_reqs) + len(active_clusters_in_req)

    # Credit computation with demonstrated vs declared-only weighting
    matched_req_count = 0
    partial_req_count = 0
    standalone_credit = 0.0

    standalone_set = {r.lower() for r in standalone_reqs}
    for s in matched_skills:
        s_name_lower = s["name"].lower()
        if s_name_lower in standalone_set:
            matched_req_count += 1
            is_dem = s.get("isDemonstrated", True)
            standalone_credit += 1.0 if is_dem else 0.80

    for s in partially_matched_skills:
        if s["name"].lower() in standalone_set:
            partial_req_count += 1
            standalone_credit += 0.50

    cluster_credits = 0.0
    matched_skills_lower = {s["name"].lower(): s for s in matched_skills}
    partial_skills_lower = {s["name"].lower(): s for s in partially_matched_skills}

    for c_idx in active_clusters_in_req:
        opts = cluster_options_map[c_idx]
        found_exact = False
        for opt in opts:
            if opt in matched_skills_lower:
                matched_req_count += 1
                is_dem = matched_skills_lower[opt].get("isDemonstrated", True)
                cluster_credits += 1.0 if is_dem else 0.80
                found_exact = True
                break
        if not found_exact:
            for opt in opts:
                if opt in partial_skills_lower:
                    partial_req_count += 1
                    cluster_credits += 0.50
                    break

    req_credit = standalone_credit + cluster_credits
    if total_req_units > 0:
        raw_req = (req_credit / total_req_units) * 100
        score_req = min(100, max(0, int(round(raw_req))))
    else:
        score_req = 0

    # -------------------------------------------------------------
    # 2. Preferred Skills Score (S_pref)
    # -------------------------------------------------------------
    has_preferred_dimension = len(preferred_skills) > 0
    pref_set = {p.lower() for p in preferred_skills}
    matched_pref_count = sum(1 for s in matched_skills if s["name"].lower() in pref_set)
    partial_pref_count = sum(1 for s in partially_matched_skills if s["name"].lower() in pref_set)

    if has_preferred_dimension:
        raw_pref = ((matched_pref_count + 0.5 * partial_pref_count) / len(preferred_skills)) * 100
        score_pref = min(100, max(0, int(round(raw_pref))))
    else:
        # Documented policy: When JD has no preferred skills, dimension is N/A with 0 points
        score_pref = 0

    # UI subScore
    if has_preferred_dimension:
        ui_technical_score = int(round(0.80 * score_req + 0.20 * score_pref))
    else:
        ui_technical_score = score_req

    # -------------------------------------------------------------
    # 3. Relevant Experience & Projects Score (S_exp)
    # -------------------------------------------------------------
    years_detected = experience_profile.get("totalYearsNumeric", 0.0)
    has_unknown_experience = (years_detected == 0.0 and experience_profile.get("yearsDetected") == "Not specified")

    target_years: Optional[float] = None
    years_req_str = experience_profile.get("yearsRequiredStr", "")
    if parsed_jd and parsed_jd.get("experienceMinYears", 0.0) > 0:
        target_years = parsed_jd["experienceMinYears"]
    elif years_req_str and years_req_str != "Not specified":
        m_yr = re.search(r"(\d+)(?:\s*(?:[\-–—]|to)\s*(\d+))?", years_req_str)
        if m_yr:
            target_years = float(m_yr.group(1))

    # Candidate's technical domain alignment factor (0.0 to 1.0)
    tech_relevance_ratio = (matched_req_count + 0.5 * partial_req_count) / max(1, total_req_units) if total_req_units > 0 else 1.0

    if is_domain_mismatch:
        tenure_score = 0
        project_relevance_score = 0
        project_delivery_quality = 0
        relevant_project_count = 0
        score_exp = 0
    else:
        # A. Professional Experience & Seniority Score
        if target_years is not None and target_years > 0:
            if has_unknown_experience:
                raw_tenure = 40
            elif years_detected >= target_years:
                raw_tenure = 100
            elif years_detected > 0:
                raw_tenure = min(100, max(0, int(round((years_detected / target_years) * 90))))
            else:
                raw_tenure = 25
        else:
            # Target years is not specified by the JD - preserve unknown without defaulting to 2.0
            if has_unknown_experience:
                raw_tenure = 50
            elif years_detected >= 5.0:
                raw_tenure = 95
            elif years_detected >= 2.0:
                raw_tenure = 85
            else:
                raw_tenure = 70

        # Weight tenure by role relevance: tenure in unrelated work does not count as senior role experience
        if tech_relevance_ratio >= 0.50:
            relevance_mult = 1.0
        else:
            relevance_mult = max(0.0, tech_relevance_ratio / 0.50)
        tenure_score = min(100, max(0, int(round(raw_tenure * relevance_mult))))

        # B. Project Delivery Quality vs Role Relevance
        project_details = experience_profile.get("projectDetails", [])
        target_skills_lower = {s.lower() for s in (required_skills + preferred_skills)}
        
        relevant_project_count = 0
        total_project_overlap = 0

        if project_details:
            # Measure delivery quality independently
            quality_points = 0
            for p in project_details:
                quality_points += 20
                if p.get("hasMetrics", False):
                    quality_points += 15
                if len(p.get("skillsUsed", [])) >= 2:
                    quality_points += 10
            project_delivery_quality = min(100, quality_points)

            # Measure role relevance strictly by demonstrated target competencies
            for p in project_details:
                p_skills = {s.lower() for s in p.get("skillsUsed", [])}
                desc_lower = p.get("description", "").lower()
                text_skills = {ts for ts in target_skills_lower if re.search(r"\b" + re.escape(ts) + r"\b", desc_lower)}
                all_overlap = p_skills.intersection(target_skills_lower).union(text_skills)
                if all_overlap:
                    relevant_project_count += 1
                    total_project_overlap += len(all_overlap)

            if relevant_project_count > 0 and len(target_skills_lower) > 0:
                overlap_ratio = min(1.0, total_project_overlap / len(target_skills_lower))
                coverage_score = overlap_ratio * 70
                count_score = (relevant_project_count / len(project_details)) * 30
                project_relevance_score = min(100, max(0, int(round(coverage_score + count_score))))
            else:
                # Unrelated projects receive 0 relevance for specialized roles
                project_relevance_score = 0
        else:
            detected_projs = experience_profile.get("detectedProjects", [])
            project_delivery_quality = 50 if detected_projs else 0
            if detected_projs and target_skills_lower:
                overlap_count = sum(1 for dp in detected_projs if any(ts in dp.lower() for ts in target_skills_lower))
                relevant_project_count = overlap_count
                project_relevance_score = min(100, int(round((overlap_count / len(detected_projs)) * 80))) if overlap_count > 0 else 0
            else:
                project_relevance_score = 0 if len(required_skills) > 0 else (40 if has_unknown_experience else 20)

        # Combined Experience and Project Relevance
        score_exp = min(100, max(0, int(round(0.60 * tenure_score + 0.40 * project_relevance_score))))

    # -------------------------------------------------------------
    # 4. Education & Eligibility Score (S_edu)
    # -------------------------------------------------------------
    detected_degree = experience_profile.get("detectedDegreeLevel", "Not specified")
    candidate_discipline = experience_profile.get("detectedDiscipline", "general")
    has_degree = detected_degree in ["Bachelor's", "Master's", "Doctorate"]

    accepted_disciplines = parsed_jd.get("acceptedDisciplines", []) if parsed_jd else []
    is_degree_mandatory = parsed_jd.get("isDegreeMandatory", False) if parsed_jd else False
    jd_quals = parsed_jd.get("qualifications", []) if parsed_jd else []
    requires_degree = is_degree_mandatory or len(jd_quals) > 0 or bool(re.search(r"\b(?:degree|bachelor|master|phd|bsn|rn)\b", str(parsed_jd), re.IGNORECASE))

    if is_domain_mismatch:
        score_edu = 0
    elif jd_domain == "Healthcare / Nursing" and candidate_discipline != "healthcare":
        score_edu = 0
    elif not requires_degree:
        if jd_domain == "Embedded / Hardware Systems" and candidate_discipline not in ["hardware_engineering", "computer_engineering"]:
            score_edu = 40 if detected_degree in ["Master's", "Doctorate"] else 35
        else:
            score_edu = 85 if has_degree else 75
    elif not has_degree:
        score_edu = 20 if is_degree_mandatory else 50
    else:
        # Candidate has a degree - evaluate discipline alignment against target requirements
        if accepted_disciplines:
            if candidate_discipline in accepted_disciplines or "related_field" in accepted_disciplines:
                # Fully accepted discipline
                score_edu = 100 if detected_degree in ["Master's", "Doctorate"] else 90
            elif "hardware_engineering" in accepted_disciplines and candidate_discipline not in ["hardware_engineering", "computer_engineering"]:
                # Specialized hardware engineering required; candidate has general software/CS or unrelated degree
                # Satisfies general higher education baseline but does not meet specialized eligibility
                score_edu = 40 if detected_degree in ["Master's", "Doctorate"] else 35
            elif candidate_discipline in ["software_cs", "computer_engineering"]:
                score_edu = 60
            else:
                score_edu = 25
        else:
            # Fallback when explicit disciplines were not extracted
            if jd_domain == "Software / Technology":
                if candidate_discipline in ["software_cs", "hardware_engineering", "computer_engineering"]:
                    score_edu = 100 if detected_degree in ["Master's", "Doctorate"] else 90
                else:
                    score_edu = 45
            elif jd_domain == "Embedded / Hardware Systems":
                if candidate_discipline in ["hardware_engineering", "computer_engineering"]:
                    score_edu = 100 if detected_degree in ["Master's", "Doctorate"] else 90
                else:
                    score_edu = 40 if detected_degree in ["Master's", "Doctorate"] else 35
            else:
                score_edu = 80

    # -------------------------------------------------------------
    # 5. Role-Specific Alignment Score (S_role)
    # -------------------------------------------------------------
    kw_found_list = keyword_analysis.get("keywordsFound", [])
    kw_missing_list = keyword_analysis.get("keywordsMissing", [])
    kw_found = len(kw_found_list)
    total_kw = kw_found + len(kw_missing_list)

    if is_domain_mismatch:
        score_role = 0
    elif total_kw > 0:
        # If candidate demonstrates <= 10% technical qualification, generic keywords
        # (e.g. general architecture, testing, agile) must not award false role-specific alignment
        if score_req <= 10:
            specialized_matches = [
                k for k in kw_found_list
                if any(t in k.get("keyword", "").lower() for t in ["hardware", "firmware", "bring-up", "rtos", "fpga", "pcb", "clinical", "nursing", "icu"])
            ]
            score_role = min(100, max(0, int(round((len(specialized_matches) / total_kw) * 100))))
        else:
            score_role = min(100, max(0, int(round((len(kw_found_list) / total_kw) * 100))))
    else:
        score_role = 0 if len(required_skills) > 0 and matched_req_count == 0 else 50

    # -------------------------------------------------------------
    # 6. ATS Formatting & Structural Hygiene Score (S_ats) - Independent
    # -------------------------------------------------------------
    score_ats = 100
    if not structural_audit.get("hasEmail", False):
        score_ats -= 15
    if not structural_audit.get("hasPhone", False):
        score_ats -= 10
    det_sec = set(structural_audit.get("detectedSections", []))
    for expected_sec in ["experience", "education", "skills"]:
        if expected_sec not in det_sec:
            score_ats -= 15
    if word_count < 200 or word_count > 2000:
        score_ats -= 10
    score_ats = min(100, max(20, score_ats))

    # -------------------------------------------------------------
    # Weight Normalization Policy
    # -------------------------------------------------------------
    w_req_base = 0.50
    w_exp_base = 0.25
    w_edu_base = 0.10
    w_pref_base = 0.10 if has_preferred_dimension else 0.00
    w_role_base = 0.05

    active_weight_sum = w_req_base + w_exp_base + w_edu_base + w_pref_base + w_role_base
    norm_factor = 1.0 / active_weight_sum

    w_req = w_req_base * norm_factor
    w_exp = w_exp_base * norm_factor
    w_edu = w_edu_base * norm_factor
    w_pref = w_pref_base * norm_factor
    w_role = w_role_base * norm_factor

    overall_float = (
        (w_req * score_req)
        + (w_exp * score_exp)
        + (w_edu * score_edu)
        + (w_pref * score_pref)
        + (w_role * score_role)
    )
    overall_score = min(100, max(0, int(round(overall_float))))

    # -------------------------------------------------------------
    # 7. Strict Critical-Requirement Caps & Domain Guards
    # -------------------------------------------------------------
    if is_domain_mismatch:
        overall_score = 0
        warnings.append(
            f"Critical domain mismatch: Candidate background in '{candidate_domain}' does not qualify "
            f"for '{jd_domain}' requirements. Overall score set to 0%."
        )
    elif len(required_skills) > 0 and matched_req_count == 0 and partial_req_count == 0:
        # Candidate matched ZERO required skills
        if overall_score > 5:
            overall_score = 5
        warnings.append(
            "Critical eligibility warning: Zero mandatory required qualifications matched. "
            "Compatibility score capped at 5% maximum."
        )
    elif target_years is not None and target_years >= 5.0 and len(required_skills) >= 4 and ((matched_req_count + 0.5 * partial_req_count) / len(required_skills)) < 0.25:
        warnings.append(
            f"Senior role eligibility warning: Candidate demonstrates fewer than 25% of core technical qualifications "
            f"for a senior {target_years:.0f}+ year expectation."
        )

    score_label = get_score_label(overall_score)
    target_exp_display = f"{target_years:.1f} yrs target" if target_years is not None else "role expectations"

    components = [
        {
            "name": "Required Qualifications Coverage",
            "weight": round(w_req, 3),
            "rawScore": score_req,
            "weightedScore": round(w_req * score_req, 2),
            "explanation": (
                f"Matched {matched_req_count} exact and {partial_req_count} partial competencies out of "
                f"{len(required_skills)} required qualifications."
            ),
        },
        {
            "name": "Experience & Project Relevance",
            "weight": round(w_exp, 3),
            "rawScore": score_exp,
            "weightedScore": round(w_exp * score_exp, 2),
            "explanation": (
                f"Assessed career tenure (~{years_detected:.1f} yrs vs {target_exp_display}) "
                f"in role domain combined with project relevance ({relevant_project_count} relevant projects)."
            ),
        },
        {
            "name": "Education & Eligibility",
            "weight": round(w_edu, 3),
            "rawScore": score_edu,
            "weightedScore": round(w_edu * score_edu, 2),
            "explanation": (
                f"Degree status: {detected_degree} ({candidate_discipline.title()}). Evaluated against target role domain."
            ),
        },
    ]

    if has_preferred_dimension:
        components.append({
            "name": "Preferred Skills Coverage",
            "weight": round(w_pref, 3),
            "rawScore": score_pref,
            "weightedScore": round(w_pref * score_pref, 2),
            "explanation": (
                f"Matched {matched_pref_count} preferred skills out of {len(preferred_skills)} desired bonus qualifications."
            ),
        })
    else:
        components.append({
            "name": "Preferred Skills (Not Applicable)",
            "weight": 0.0,
            "rawScore": 0,
            "weightedScore": 0.0,
            "explanation": (
                "Job description does not specify preferred qualifications. Weight redistributed proportionally to active criteria."
            ),
        })

    components.append({
        "name": "Role-Specific Alignment",
        "weight": round(w_role, 3),
        "rawScore": score_role,
        "weightedScore": round(w_role * score_role, 2),
        "explanation": (
            f"Evaluated {kw_found} distinct domain concepts without double-counting technical skills."
        ),
    })

    formula_parts = [f"{round(comp['weight']*100):.0f}% * {comp['name'].split()[0]}" for comp in components if comp["weight"] > 0]
    formula_str = "OverallScore = " + " + ".join(formula_parts)

    return {
        "status": "completed",
        "overallScore": overall_score,
        "jobCompatibilityScore": overall_score,
        "atsFormattingScore": score_ats,
        "scoreLabel": score_label,
        "subScores": {
            "technicalSkills": ui_technical_score,
            "experienceRelevance": score_exp,
            "atsFormatting": score_ats,
            "keywordDensity": score_role,
        },
        "scoreBreakdown": {
            "components": components,
            "calculationFormula": formula_str,
        },
        "warnings": warnings,
        "projectRelevance": {
            "relevantProjectCount": relevant_project_count,
            "projectRelevanceScore": project_relevance_score if not is_domain_mismatch else 0,
        },
    }
