import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Target, 
  Search, 
  TrendingUp, 
  BarChart3,
  Check
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export function LandingPage() {
  const features = [
    {
      icon: Target,
      title: 'Precision Skill Gap Detection',
      description: 'Parses required technical competencies, frameworks, and domain tooling directly from the job description and isolates missing qualifications.',
    },
    {
      icon: TrendingUp,
      title: 'Action-Driven Bullet Enhancement',
      description: 'Recommends quantified, high-impact phrasing utilizing the industry-standard STAR methodology to maximize ATS visibility.',
    },
    {
      icon: Search,
      title: 'Keyword Density & Alignment',
      description: 'Calculates exact match frequencies and extracts critical terms from the job posting to ensure your resume clears automated filtering.',
    },
    {
      icon: ShieldCheck,
      title: 'ATS Formatting Health Audit',
      description: 'Inspects layout hierarchy, parseability standards, and section sequencing to eliminate document extraction failures.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Upload Candidate Resume',
      desc: 'Drop in your existing resume in PDF (.pdf) or Word (.docx) format.',
    },
    {
      step: '02',
      title: 'Paste Job Description',
      desc: 'Provide the full job description or select from pre-configured engineering samples.',
    },
    {
      step: '03',
      title: 'Review Audit & Recommendations',
      desc: 'Inspect your multi-factor match score, missing skills breakdown, and tailored bullet point revisions.',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#16181F] text-zinc-300 border border-[#262A37]">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span>Deterministic Match Engine</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-zinc-100 tracking-tight leading-[1.15]">
              Optimize Your Resume for Any Job Posting
            </h1>

            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Eliminate guesswork from applicant tracking systems. Simply provide your resume and target job description to receive an objective compatibility score and prioritized skill breakdown.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link to="/analyze" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto">
                  Analyze Resume Now
                </Button>
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" icon={BarChart3} className="w-full sm:w-auto">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Step Process */}
      <section className="py-16 border-y border-[#1E222D] bg-[#0C0E12]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              Workflow
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
              Direct, Two-Input Analysis
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2">
              No extraneous metadata or complex configuration needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((item) => (
              <div
                key={item.step}
                className="p-6 rounded-2xl bg-[#111318] border border-[#232734] shadow-xs"
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center font-mono text-xs font-bold mb-4">
                  {item.step}
                </div>
                <h4 className="text-sm font-semibold text-zinc-100 mb-2">
                  {item.title}
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              Engine Capabilities
            </h2>
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
              Rigorous Compatibility Assessment
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#111318] border border-[#232734] hover:border-zinc-600 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/70 flex items-center justify-center text-zinc-200 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-100 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Bottom Call to Action Card */}
          <div className="mt-16 p-8 sm:p-10 rounded-2xl bg-[#111318] border border-[#262A37] text-center space-y-4">
            <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight">
              Ready to evaluate your match rate?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
              Test your resume against real job requirements in seconds with deterministic NLP intelligence.
            </p>
            <div className="pt-2">
              <Link to="/analyze">
                <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                  Start Resume Evaluation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
