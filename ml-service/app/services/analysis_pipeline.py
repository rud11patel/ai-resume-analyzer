import time
import re
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.core.config import settings
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    SubScores,
    ScoreBreakdown,
    SkillMatchSummary,
    MatchedSkill,
    PartiallyMatchedSkill,
    MissingSkill,
    UncertainSkill,
    KeywordFound,
    KeywordMissing,
    ExperienceRelevance,
    ExperienceBreakdownItem,
    ResumeSummary,
    JobRequirements,
    ProjectAnalysis,
    Recommendation,
    ImprovedBulletPoint,
    ATSCheck,
)
from app.services.text_preprocessing import (
    clean_text,
    segment_resume_sections,
    audit_document_structure,
    extract_bullet_points,
)
from app.services.job_description_parser import parse_job_description
from app.services.skill_extraction import extract_resume_profile
from app.services.semantic_matching import matcher_service
from app.services.scoring import calculate_compatibility_score
from app.services.recommendation_engine import (
    generate_recommendations,
    generate_improved_bullet_points,
    generate_ats_checks,
)


def run_analysis_pipeline(request: AnalysisRequest) -> AnalysisResponse:
    """
    Executes the end-to-end resume vs job description AI/NLP analysis pipeline.
    Produces deterministic, structured, explainable results adhering to AnalysisResponse.
    Uses a unified requirements model across all parsing, matching, and scoring phases.
    """
    start_time = time.time()
    raw_resume = request.resume_text or ""
    raw_jd = request.job_description or ""

    # 1. Clean & Preprocess
    cleaned_resume = clean_text(raw_resume)
    cleaned_jd = clean_text(raw_jd)

    # 2. Audit structural layout & sections
    structural_audit = audit_document_structure(cleaned_resume)

    # Early exit if resume is empty or unextractable
    if structural_audit["wordCount"] < 20:
        return AnalysisResponse(
            status="insufficient_data",
            overallScore=0,
            jobCompatibilityScore=0,
            atsFormattingScore=20,
            scoreLabel="Low Match",
            subScores=SubScores(
                technicalSkills=0,
                experienceRelevance=0,
                atsFormatting=20,
                keywordDensity=0,
            ),
            scoreBreakdown=ScoreBreakdown(
                components=[],
                calculationFormula="Score = 0 (Insufficient resume text provided)",
            ),
            skillMatchSummary=SkillMatchSummary(
                totalIdentified=0,
                matchedCount=0,
                missingCount=0,
                percentage=0,
            ),
            matchedSkills=[],
            partiallyMatchedSkills=[],
            missingSkills=[],
            uncertainSkills=[],
            keywordsFound=[],
            keywordsMissing=[],
            experienceRelevance=ExperienceRelevance(
                yearsRequired="Not specified",
                yearsDetected="0 years",
                levelAssessment="Insufficient resume text provided for experience evaluation.",
                breakdown=[],
            ),
            resumeSummary=ResumeSummary(
                detectedTitle=None,
                wordCount=structural_audit["wordCount"],
                sectionsDetected=[],
                qualificationsSummary=None,
                topSkillCategories=[],
            ),
            jobRequirements=JobRequirements(
                roleTitle=request.role_title or "Target Role",
                requiredSkills=[],
                preferredSkills=[],
                experienceYearsRequired="Not specified",
                qualifications=[],
            ),
            projectAnalysis=ProjectAnalysis(
                detectedProjectsCount=0,
                relevantProjects=[],
                projectRelevanceScore=0,
                comments="No projects detected due to insufficient text.",
            ),
            recommendations=[
                Recommendation(
                    impact="High Impact",
                    title="Upload a valid resume with readable text",
                    description="The uploaded document contains little to no extractable text layer. Please ensure your PDF or DOCX is not an un-OCRed scan.",
                )
            ],
            improvedBulletPoints=[],
            atsChecks=generate_ats_checks(structural_audit),
            warnings=["Resume text contains fewer than 20 words."],
            modelMetadata={
                "engineVersion": settings.engine_version,
                "algorithm": settings.algorithm_name,
                "executionTimeMs": int((time.time() - start_time) * 1000),
            },
        )

    # 3. Parse Job Description with Unified Requirements Model
    parsed_jd = parse_job_description(
        cleaned_jd,
        provided_title=request.role_title,
        provided_company=request.company,
    )

    # 4. Extract Resume Skills and Profile
    resume_profile = extract_resume_profile(cleaned_resume)
    resume_skills = resume_profile["skills"]

    # 5. Hybrid Evidence-Based Skill Matching
    match_results = matcher_service.match_requirements(
        resume_skills=resume_skills,
        required_skills=parsed_jd["requiredSkills"],
        preferred_skills=parsed_jd["preferredSkills"],
        resume_text=cleaned_resume,
        jd_text=cleaned_jd,
    )

    # 6. Distinct Role-Specific Keyword Alignment (No double counting of skills)
    keywords_found: List[KeywordFound] = []
    keywords_missing: List[KeywordMissing] = []

    for kw_item in parsed_jd["keywords"]:
        kw_name = kw_item["keyword"]
        kw_pattern = kw_item.get("pattern", re.escape(kw_name))
        is_found = bool(re.search(kw_pattern, cleaned_resume, re.IGNORECASE)) or (kw_name.lower() in cleaned_resume.lower())
        if is_found:
            keywords_found.append(KeywordFound(
                keyword=kw_name,
                count=max(1, kw_item.get("count", 1)),
                relevance=kw_item.get("importance", "Medium"),
            ))
        else:
            keywords_missing.append(KeywordMissing(
                keyword=kw_name,
                importance=kw_item.get("importance", "Medium"),
                suggestion=f"If you have experience with {kw_name}, include it in relevant accomplishment bullet points.",
            ))

    keyword_analysis_dict = {
        "keywordsFound": [k.model_dump() for k in keywords_found],
        "keywordsMissing": [k.model_dump() for k in keywords_missing],
    }

    # 7. Experience Relevance Assessment
    years_detected = resume_profile["totalYearsNumeric"]
    years_req_str = parsed_jd["experienceYearsRequired"]
    min_years_req = parsed_jd.get("experienceMinYears", 0.0)
    resume_profile["yearsRequiredStr"] = years_req_str

    if min_years_req > 0 and years_detected < (min_years_req * 0.5):
        level_assessment = (
            f"Detected approximately {resume_profile['yearsDetected']} of experience against "
            f"target requirement of '{years_req_str}'. Seniority shortfall identified."
        )
    elif min_years_req > 0 and years_detected >= min_years_req:
        level_assessment = (
            f"Detected approximately {resume_profile['yearsDetected']} of professional experience, "
            f"satisfying target seniority requirement of '{years_req_str}'."
        )
    else:
        level_assessment = (
            f"Assessed career tenure of {resume_profile['yearsDetected']} against role expectations."
        )

    # 8. Deterministic Normalized Scoring
    score_result = calculate_compatibility_score(
        matched_skills=match_results["matchedSkills"],
        partially_matched_skills=match_results["partiallyMatchedSkills"],
        missing_skills=match_results["missingSkills"],
        required_skills=parsed_jd["requiredSkills"],
        preferred_skills=parsed_jd["preferredSkills"],
        experience_profile=resume_profile,
        keyword_analysis=keyword_analysis_dict,
        structural_audit=structural_audit,
        parsed_jd=parsed_jd,
    )

    # Experience breakdown items based on actual calculated dimensions
    skill_pct = match_results["skillMatchSummary"]["percentage"]
    tenure_score = score_result["subScores"]["experienceRelevance"]
    proj_relevance_score = score_result.get("projectRelevance", {}).get("projectRelevanceScore", 40)

    experience_breakdown = [
        ExperienceBreakdownItem(
            area="Core Technology Alignment",
            score=min(100, max(0, skill_pct)),
            comment=f"Direct technical match across required qualifications ({match_results['skillMatchSummary']['matchedCount']} matched).",
        ),
        ExperienceBreakdownItem(
            area="Career Tenure & Seniority",
            score=min(100, max(0, tenure_score)),
            comment=f"Assessed tenure of ~{resume_profile['yearsDetected']} against job requirement of '{years_req_str}'.",
        ),
        ExperienceBreakdownItem(
            area="Project & Delivery Evidence",
            score=min(100, max(0, proj_relevance_score)),
            comment="Relevance-weighted project portfolio items exhibiting practical technical capability.",
        ),
    ]

    experience_relevance = ExperienceRelevance(
        yearsRequired=years_req_str,
        yearsDetected=resume_profile["yearsDetected"],
        levelAssessment=level_assessment,
        breakdown=experience_breakdown,
    )

    # 9. Recommendations, Bullet Point Improvements, and ATS Checks
    recommendations_raw = generate_recommendations(
        missing_skills=match_results["missingSkills"],
        partially_matched_skills=match_results["partiallyMatchedSkills"],
        structural_audit=structural_audit,
        keyword_analysis=keyword_analysis_dict,
        years_detected=years_detected,
        years_required_str=years_req_str,
    )
    recommendations = [Recommendation(**r) for r in recommendations_raw]

    # Extract experience bullets for transformation
    exp_text = resume_profile["sections"].get("experience", "") or resume_profile["sections"].get("projects", "")
    bullets_to_check = extract_bullet_points(exp_text)
    improved_bullets_raw = generate_improved_bullet_points(bullets_to_check, match_results["matchedSkills"])
    improved_bullets = [ImprovedBulletPoint(**b) for b in improved_bullets_raw]

    ats_checks_raw = generate_ats_checks(structural_audit)
    ats_checks = [ATSCheck(**c) for c in ats_checks_raw]

    # 10. Project Analysis with Relevance
    proj_count = len(resume_profile["detectedProjects"])
    relevant_proj_count = score_result.get("projectRelevance", {}).get("relevantProjectCount", 0)

    # Identify which projects had overlap
    target_skills_lower = {s.lower() for s in (parsed_jd["requiredSkills"] + parsed_jd["preferredSkills"])}
    relevant_projects: List[str] = []
    for p_str in resume_profile["detectedProjects"]:
        if any(ts in p_str.lower() for ts in target_skills_lower):
            relevant_projects.append(p_str)

    if not relevant_projects and resume_profile["detectedProjects"]:
        relevant_projects = resume_profile["detectedProjects"][:2]

    project_analysis = ProjectAnalysis(
        detectedProjectsCount=proj_count,
        relevantProjects=relevant_projects[:4],
        projectRelevanceScore=proj_relevance_score,
        comments=(
            f"Identified {proj_count} project portfolio items ({relevant_proj_count} directly relevant to target role requirements)."
        ),
    )

    # 11. Resume Summary & Job Requirements
    # Detect title from resume content rather than echoing JD title
    resume_lines = cleaned_resume.split("\n")
    detected_resume_title = None
    for r_line in resume_lines[:6]:
        r_line_clean = r_line.strip()
        if re.search(r"\b(?:engineer|developer|architect|designer|scientist|specialist|lead|consultant|manager|intern)\b", r_line_clean, re.IGNORECASE):
            if len(r_line_clean) < 60 and not any(c in r_line_clean for c in [":", "@", "|"]):
                detected_resume_title = r_line_clean
                break

    if not detected_resume_title:
        detected_resume_title = "Software Professional"

    resume_summary = ResumeSummary(
        detectedTitle=detected_resume_title,
        wordCount=structural_audit["wordCount"],
        sectionsDetected=structural_audit["detectedSections"],
        qualificationsSummary=resume_profile["qualificationsSummary"],
        topSkillCategories=resume_profile["topSkillCategories"],
    )

    job_requirements = JobRequirements(
        roleTitle=parsed_jd["roleTitle"],
        requiredSkills=parsed_jd["requiredSkills"],
        preferredSkills=parsed_jd["preferredSkills"],
        experienceYearsRequired=parsed_jd["experienceYearsRequired"],
        qualifications=parsed_jd["qualifications"],
    )

    # Convert match results to typed Pydantic models
    matched_skills_typed = [MatchedSkill(**s) for s in match_results["matchedSkills"]]
    partially_matched_typed = [PartiallyMatchedSkill(**s) for s in match_results["partiallyMatchedSkills"]]
    missing_skills_typed = [MissingSkill(**s) for s in match_results["missingSkills"]]
    uncertain_skills_typed = [UncertainSkill(**s) for s in match_results["uncertainSkills"]]

    elapsed_ms = int((time.time() - start_time) * 1000)

    return AnalysisResponse(
        status="completed",
        overallScore=score_result["overallScore"],
        jobCompatibilityScore=score_result.get("jobCompatibilityScore", score_result["overallScore"]),
        atsFormattingScore=score_result.get("atsFormattingScore", 85),
        scoreLabel=score_result["scoreLabel"],
        subScores=SubScores(**score_result["subScores"]),
        scoreBreakdown=ScoreBreakdown(**score_result["scoreBreakdown"]),
        skillMatchSummary=SkillMatchSummary(**match_results["skillMatchSummary"]),
        matchedSkills=matched_skills_typed,
        partiallyMatchedSkills=partially_matched_typed,
        missingSkills=missing_skills_typed,
        uncertainSkills=uncertain_skills_typed,
        keywordsFound=keywords_found,
        keywordsMissing=keywords_missing,
        experienceRelevance=experience_relevance,
        resumeSummary=resume_summary,
        jobRequirements=job_requirements,
        projectAnalysis=project_analysis,
        recommendations=recommendations,
        improvedBulletPoints=improved_bullets,
        atsChecks=ats_checks,
        warnings=score_result.get("warnings", []),
        modelMetadata={
            "engineVersion": settings.engine_version,
            "algorithm": settings.algorithm_name,
            "executionTimeMs": elapsed_ms,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )
