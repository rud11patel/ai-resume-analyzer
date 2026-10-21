import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  Zap, 
  Target, 
  Search, 
  TrendingUp, 
  Code2,
  FileCheck2,
  BarChart3
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export function LandingPage() {
  const features = [
    {
      icon: Target,
      title: 'Precision Skill Gap Analysis',
      description: 'Automatically detects required technical proficiencies, tools, and libraries from the job description and pinpoints missing competencies in your resume.',
      color: 'indigo',
    },
    {
      icon: TrendingUp,
      title: 'AI Bullet Point Rewriter',
      description: 'Transforms weak, passive job descriptions into high-impact, quantified achievement statements using the industry-proven STAR methodology.',
      color: 'emerald',
    },
    {
      icon: Search,
      title: 'ATS Keyword Optimization',
      description: 'Extracts critical keywords from job listings and identifies keyword density gaps to help your resume sail through Applicant Tracking Systems.',
      color: 'blue',
    },
    {
      icon: ShieldCheck,
      title: 'ATS Formatting Health Check',
      description: 'Audits multi-column structures, typography compatibility, heading hierarchy, and date order to prevent parsing bottlenecks.',
      color: 'amber',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Upload Your Resume',
      desc: 'Drop in your existing resume in PDF (.pdf) or Word (.docx) format up to 5MB.',
    },
    {
      step: '02',
      title: 'Paste Target Job Posting',
      desc: 'Provide the full job description or choose from one of our pre-curated industry samples.',
    },
    {
      step: '03',
      title: 'Review Actionable Report',
      desc: 'Inspect your compatibility score, missing keywords, experience alignment, and tailored recommendations.',
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 backdrop-blur-xs animate-in fade-in slide-in-from-top-4 duration-500">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Next-Generation Resume Optimization &bull; Phase 2 UI</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Land More Interviews with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">
                Data-Driven Resume Matching
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Stop guessing why your resume isn't getting past applicant tracking systems. 
              Upload your resume, paste any job description, and instantly receive a complete compatibility breakdown.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
              <Link to="/analyze" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right" className="w-full sm:w-auto">
                  Analyze Your Resume Now
                </Button>
              </Link>
              <Link to="/dashboard" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" icon={BarChart3} className="w-full sm:w-auto">
                  Explore Demo Dashboard
                </Button>
              </Link>
            </div>

            <div className="pt-2 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> No signup required to test
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Instant client-side analysis
              </span>
            </div>
          </div>

          {/* Interactive Preview Mockup Card */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="font-mono text-slate-400 ml-2">ResumeAI Compatibility Dashboard</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                84% Strong Match Demo
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Score teaser */}
              <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center bg-emerald-500/10 mb-3 shadow-lg shadow-emerald-500/20">
                  <span className="text-3xl font-extrabold font-mono text-white">84%</span>
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Strong</span>
                </div>
                <h4 className="text-sm font-bold text-white">Senior Frontend Engineer</h4>
                <p className="text-xs text-slate-400 mt-1">Stripe / FinTech Cloud</p>
              </div>

              {/* Matched & Missing teaser */}
              <div className="md:col-span-2 space-y-4 p-6 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High-Confidence Skills Detected
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['React', 'TypeScript', 'Tailwind CSS', 'JavaScript (ES6+)', 'REST APIs', 'Vite'].map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" /> Key Skill Gaps to Address
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {['GraphQL Queries', 'Cypress / Playwright E2E', 'Docker Workflow'].map((s) => (
                      <span key={s} className="px-2.5 py-1 rounded-lg text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/results/analysis-01"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    View this full sample analysis report <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">
              Comprehensive Resume Intelligence
            </h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              Engineered to outsmart strict applicant tracking filters
            </h3>
            <p className="text-sm text-slate-400 mt-3">
              Modern recruiters receive hundreds of applications per role. Our multi-dimensional engine ensures your profile stands out clearly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">{feat.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Section */}
      <section className="py-20 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
              Simple 3-Step Process
            </h2>
            <h3 className="text-3xl font-bold text-white tracking-tight">
              From upload to optimization in under two minutes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {steps.map((st, idx) => (
              <div
                key={idx}
                className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800"
              >
                <div className="text-3xl font-black font-mono text-indigo-500/40 mb-3">
                  {st.step}
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{st.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/analyze">
              <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                Start Resume Match Test
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
