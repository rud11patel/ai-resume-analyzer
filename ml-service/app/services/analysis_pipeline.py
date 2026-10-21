import time
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

    # 3. Parse Job Description
    parsed_jd = parse_job_description(
        cleaned_jd,
        provided_title=request.role_title,
        provided_company=request.company,
    )

    # 4. Extract Resume Skills and Profile
    resume_profile = extract_resume_profile(cleaned_resume)
    resume_skills = resume_profile["skills"]

    # 5. Hybrid Semantic Skill Matching
    match_results = matcher_service.match_requirements(
        resume_skills=resume_skills,
        required_skills=parsed_jd["requiredSkills"],
        preferred_skills=parsed_jd["preferredSkills"],
        resume_text=cleaned_resume,
        jd_text=cleaned_jd,
    )

    # 6. Keyword Coverage Analysis
    keywords_found: List[KeywordFound] = []
    keywords_missing: List[KeywordMissing] = []

    matched_names = {s["name"].lower() for s in match_results["matchedSkills"]}
    for kw_item in parsed_jd["keywords"]:
        kw_name = kw_item["keyword"]
        kw_lower = kw_name.lower()
        if kw_lower in cleaned_resume.lower() or kw_lower in matched_names:
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
    resume_profile["yearsRequiredStr"] = years_req_str

    level_assessment = (
        f"Detected approximately {resume_profile['yearsDetected']} of professional experience. "
        f"Alignment with target requirement of '{years_req_str}' demonstrates solid technical foundation."
    )

    experience_breakdown = [
        ExperienceBreakdownItem(
            area="Core Technology Alignment",
            score=min(95, max(40, match_results["skillMatchSummary"]["percentage"] + 10)),
            comment="Coverage across required frameworks and programming languages.",
        ),
        ExperienceBreakdownItem(
            area="Career Tenure & Seniority",
            score=85 if years_detected >= 3.0 else (70 if years_detected > 1.0 else 55),
            comment=f"Assessed tenure of ~{resume_profile['yearsDetected']} against job expectations.",
        ),
        ExperienceBreakdownItem(
            area="Project & Delivery Evidence",
            score=80 if len(resume_profile["detectedProjects"]) > 0 else 60,
            comment="Tangible evidence of delivered software systems and components.",
        ),
    ]

    experience_relevance = ExperienceRelevance(
        yearsRequired=years_req_str,
        yearsDetected=resume_profile["yearsDetected"],
        levelAssessment=level_assessment,
        breakdown=experience_breakdown,
    )

    # 8. Deterministic Scoring
    score_result = calculate_compatibility_score(
        matched_skills=match_results["matchedSkills"],
        partially_matched_skills=match_results["partiallyMatchedSkills"],
        missing_skills=match_results["missingSkills"],
        required_skills=parsed_jd["requiredSkills"],
        preferred_skills=parsed_jd["preferredSkills"],
        experience_profile=resume_profile,
        keyword_analysis=keyword_analysis_dict,
        structural_audit=structural_audit,
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

    # 10. Project Analysis
    proj_count = len(resume_profile["detectedProjects"])
    project_analysis = ProjectAnalysis(
        detectedProjectsCount=proj_count,
        relevantProjects=resume_profile["detectedProjects"][:4],
        projectRelevanceScore=min(95, max(50, 60 + proj_count * 8)),
        comments=f"Identified {proj_count} project portfolio items exhibiting practical technical capability.",
    )

    # 11. Resume Summary & Job Requirements
    resume_summary = ResumeSummary(
        detectedTitle=parsed_jd["roleTitle"],
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
        warnings=[],
        modelMetadata={
            "engineVersion": settings.engine_version,
            "algorithm": settings.algorithm_name,
            "executionTimeMs": elapsed_ms,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )
