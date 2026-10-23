from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    resume_text: str = Field(..., description="Extracted plain text of candidate resume")
    job_description: str = Field(..., description="Raw text of target job posting")
    role_title: Optional[str] = Field(None, description="Optional target role title")
    company: Optional[str] = Field(None, description="Optional target company name")


class MatchedSkill(BaseModel):
    name: str
    category: str
    level: str  # e.g., 'Expert', 'Proficient', 'Intermediate'
    confidence: int  # 0 to 100
    evidence: Optional[str] = None


class PartiallyMatchedSkill(BaseModel):
    name: str
    category: str
    matchBasis: str  # e.g., 'Semantic similarity with GraphQL', 'Related ecosystem'
    confidence: int
    evidence: Optional[str] = None
    explanation: str


class MissingSkill(BaseModel):
    name: str
    category: str
    priority: str  # 'High', 'Medium', 'Low'
    context: Optional[str] = None


class UncertainSkill(BaseModel):
    name: str
    reason: str
    context: Optional[str] = None


class SkillMatchSummary(BaseModel):
    totalIdentified: int
    matchedCount: int
    missingCount: int
    percentage: int


class KeywordFound(BaseModel):
    keyword: str
    count: int
    relevance: str  # 'High', 'Medium', 'Low'


class KeywordMissing(BaseModel):
    keyword: str
    importance: str  # 'High', 'Medium'
    suggestion: str


class ExperienceBreakdownItem(BaseModel):
    area: str
    score: int
    comment: str


class ExperienceRelevance(BaseModel):
    yearsRequired: str
    yearsDetected: str
    levelAssessment: str
    breakdown: List[ExperienceBreakdownItem] = []


class Recommendation(BaseModel):
    impact: str  # 'High Impact', 'Medium Impact', 'Quick Win'
    title: str
    description: str
    category: Optional[str] = None


class ImprovedBulletPoint(BaseModel):
    original: str
    improved: str
    rationale: str


class ATSCheck(BaseModel):
    item: str
    status: str  # 'Passed', 'Warning', 'Failed'
    message: str


class SubScores(BaseModel):
    technicalSkills: int
    experienceRelevance: int
    atsFormatting: int
    keywordDensity: int


class ResumeSummary(BaseModel):
    detectedTitle: Optional[str] = None
    wordCount: int = 0
    sectionsDetected: List[str] = []
    qualificationsSummary: Optional[str] = None
    topSkillCategories: List[str] = []


class JobRequirements(BaseModel):
    roleTitle: str
    requiredSkills: List[str] = []
    preferredSkills: List[str] = []
    experienceYearsRequired: str
    qualifications: List[str] = []


class ProjectAnalysis(BaseModel):
    detectedProjectsCount: int = 0
    relevantProjects: List[str] = []
    projectRelevanceScore: int = 0
    comments: Optional[str] = None


class ScoreBreakdownComponent(BaseModel):
    name: str
    weight: float
    rawScore: int
    weightedScore: float
    explanation: str


class ScoreBreakdown(BaseModel):
    components: List[ScoreBreakdownComponent] = []
    calculationFormula: str = "Sum(rawScore * weight)"


class AnalysisResponse(BaseModel):
    status: str = "completed"  # 'completed' or 'insufficient_data'
    overallScore: int
    jobCompatibilityScore: Optional[int] = None
    atsFormattingScore: Optional[int] = None
    scoreLabel: str
    subScores: SubScores
    scoreBreakdown: ScoreBreakdown
    skillMatchSummary: SkillMatchSummary
    matchedSkills: List[MatchedSkill] = []
    partiallyMatchedSkills: List[PartiallyMatchedSkill] = []
    missingSkills: List[MissingSkill] = []
    uncertainSkills: List[UncertainSkill] = []
    keywordsFound: List[KeywordFound] = []
    keywordsMissing: List[KeywordMissing] = []
    experienceRelevance: ExperienceRelevance
    resumeSummary: ResumeSummary
    jobRequirements: JobRequirements
    projectAnalysis: ProjectAnalysis
    recommendations: List[Recommendation] = []
    improvedBulletPoints: List[ImprovedBulletPoint] = []
    atsChecks: List[ATSCheck] = []
    warnings: List[str] = []
    modelMetadata: Dict[str, Any] = Field(default_factory=dict)
