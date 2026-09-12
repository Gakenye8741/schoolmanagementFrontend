import { Navbar } from '../components/Navbar';
import { 
  Building2, 
  ShieldCheck, 
  HeartHandshake, 
  Sparkles, 

  ArrowRight,
  Cpu,

  BookOpen,
  Users,
  Target,

  Rocket,
  Code2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Footer } from '../components/Footer';
import { usePageSeo } from '../hooks/usePageSeo';

const AboutPage = () => {
  usePageSeo({
    title: "About ElimuCloud | Secure Multi-Tenant Architecture & Engineering by  Gakenye Ndiritu",
    description: "Explore the enterprise-grade technical architecture, multi-tenant database isolation, and high-performance cloud infrastructure behind ElimuCloud, conceptualized and engineered by full-stack developer  Gakenye Ndiritu.",
    keywords: "about ElimuCloud,  Gakenye Ndiritu, full-stack software engineer Kenya, multi-tenant school ERP, PostgreSQL Drizzle ORM, React Vite architecture, educational technology platform"
  });
  const stats = [
    { label: "Pioneer Pilot Schools", value: "15+" },
    { label: "Test Student Accounts", value: "5,000+" },
    { label: "Test Cohort Teachers", value: "400+" },
    { label: "System Uptime", value: "99.9%" }
  ];

  const values = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: "Uncompromising Security",
      description: "We safeguard student records and financial ledgers with robust encryption and automated daily backups, ensuring zero data loss during active testing."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-primary" />,
      title: "Radical Simplicity",
      description: "Complex school operations distilled into intuitive, clutter-free interfaces that teachers and administrators can master in minutes."
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-primary" />,
      title: "Collaborative Feedback Loop",
      description: "Working side-by-side with school leaders during our pilot phase to rapidly iterate, refine, and deploy user-driven enhancements."
    },
    {
      icon: <Cpu className="w-6 h-6 text-primary" />,
      title: "Rigorous System Tuning",
      description: "Stress-testing every core module—from automated fee tracking to real-time parent notifications—for peak reliability under daily school loads."
    }
  ];

  const milestones = [
    {
      year: "2024",
      title: "Inception & Vision",
      description: "Identified the immense administrative friction and paperwork burden facing schools, sparking the vision for an integrated cloud platform."
    },
    {
      year: "2025",
      title: "Architecture & Development",
      description: "Engineered the core database structures, secure multi-portal authentication workflows, and automated receipting modules."
    },
    {
      year: "2026",
      title: "Live Pilot Rollout",
      description: "Launched active testing environments with pioneer educational institutions, collecting real-world feedback to perfect every feature."
    }
  ];

  const corePillars = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Academic Automation",
      description: "Streamlining student admissions, grading entry, and instant termly report card generation."
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Multi-Portal Ecosystem",
      description: "Dedicated, role-secure access pipelines tailored specifically for Administrators, Teachers, and Parents."
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Financial Clarity",
      description: "Transparent fee tracking, instant cash/bank receipting, and automated balance calculations."
    }
  ];

  return (
    <>
      <Toaster richColors position="top-right" />
      
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <div className="h-16"></div>

      <div className="min-h-[calc(100vh-4rem)] bg-base-100 text-base-content pb-24 overflow-hidden font-sans">
        
        {/* Hero Section */}
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-base-200/60 via-base-100 to-base-100 border-b border-base-300">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              
             
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-base-content">
                Engineering the Future of <span className="text-primary underline decoration-primary/30 underline-offset-8">School Management</span>
              </h1>
              
              <p className="text-base sm:text-lg text-base-content/70 leading-relaxed max-w-2xl mx-auto font-medium">
                ElimuCloud is currently undergoing rigorous live pilot testing with pioneer educational institutions, combining cutting-edge cloud architecture with practical school administration.
              </p>

            </div>
          </div>
        </section>

        {/* Numbers Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 -mt-10 relative z-20">
          <div className="bg-base-100 border border-base-300 rounded-3xl p-8 shadow-2xl grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((stat, sIndex) => (
              <div key={sIndex} className="space-y-1 p-4 rounded-2xl bg-base-200/40 border border-base-300/60">
                <p className="text-3xl sm:text-4xl font-black text-primary">{stat.value}</p>
                <p className="text-xs sm:text-sm font-bold text-base-content/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Our Mission & Narrative Section */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest inline-block">
                  Our Core Mission
                </span>
                
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  Built to Eliminate Administrative Friction in Schools
                </h2>
                
                <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
                  Traditional school administration often bogs down educators with endless ledgers, manual fee reconciliation, and stressful report card compilation. ElimuCloud was conceived to replace paper-heavy workflows with a unified, lightning-fast digital ecosystem.
                </p>
                
                <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
                  During our active pilot phase, we are collaborating directly with pioneer schools. Every line of code and feature tweak is driven by real daily feedback from teachers, bursars, and headteachers on the ground.
                </p>

                <div className="pt-4 flex flex-wrap gap-4">
                  <Link to="/contact" className="btn btn-primary rounded-2xl font-bold px-6 shadow-md gap-2 hover:scale-105 transition-transform">
                    Contact Us to Join <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/pricing" className="btn btn-outline border-base-300 hover:bg-base-200 rounded-2xl font-bold px-6">
                    View Packages
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <div className="bg-gradient-to-br from-base-200/80 to-base-200/30 border border-base-300 rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Rocket className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-extrabold">Active Pilot Focus Areas</h3>
                  </div>

                  <div className="space-y-4">
                    {corePillars.map((pillar, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-4 p-4 rounded-2xl bg-base-100 border border-base-300/60 shadow-sm">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                          {pillar.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-base-content">{pillar.title}</h4>
                          <p className="text-xs text-base-content/70 mt-0.5 leading-relaxed">{pillar.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Meet the Developer Section */}
        <section className="py-20 bg-base-200/40 border-y border-base-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-base-100 border border-base-300 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-4 text-center lg:text-left space-y-4">
                <div className="w-24 h-24 rounded-3xl bg-primary text-primary-content flex items-center justify-center mx-auto lg:mx-0 shadow-2xl font-black text-4xl ring-4 ring-primary/20">
                  BG
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-base-content"> Gakenye Ndiritu</h3>
                  <p className="text-xs font-extrabold text-primary uppercase tracking-wider mt-1">Lead Software Engineer & Creator</p>
                </div>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                  <span className="text-[11px] bg-primary/10 text-primary font-extrabold px-3 py-1 rounded-lg">Full-Stack Architect</span>
                  <span className="text-[11px] bg-primary/10 text-primary font-extrabold px-3 py-1 rounded-lg">Pilot Lead</span>
                </div>
              </div>

              <div className="lg:col-span-8 space-y-4 text-sm sm:text-base text-base-content/70 leading-relaxed border-t lg:border-t-0 lg:border-l border-base-300 pt-8 lg:pt-0 lg:pl-10">
                <span className="text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest inline-block">
                  Engineering Leadership
                </span>
                <h4 className="text-2xl font-extrabold text-base-content">Direct Oversight of System Performance</h4>
                <p>
                  ElimuCloud is entirely designed, engineered, and maintained by  Gakenye Ndiritu. Throughout this testing phase,  works directly alongside school administrators to analyze server performance logs, review feedback, and deploy tailored feature upgrades.
                </p>
                <p>
                  The primary objective of this rigorous pilot period is to guarantee that when educational institutions officially onboard onto ElimuCloud, every module operates with absolute stability, lightning speed, and uncompromising reliability.
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs font-bold text-primary">
                  <Code2 className="w-4 h-4" /> Crafted with precision using modern full-stack web technologies.
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full">
                Guiding Principles
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Our Core Values
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                Every feature we build is anchored in trust, ironclad security, and absolute ease of use.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((val, vIndex) => (
                <div 
                  key={vIndex}
                  className="bg-base-200/50 border border-base-300 rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {val.icon}
                    </div>
                    <h3 className="text-lg font-extrabold text-base-content group-hover:text-primary transition-colors">{val.title}</h3>
                    <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">{val.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Journey Timeline */}
        <section className="py-20 bg-base-200/40 border-y border-base-300">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full">
                Our Evolution
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                How Far We Have Come
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                From a conceptual blueprint to a trusted testing platform for pioneer schools.
              </p>
            </div>

            <div className="space-y-8 relative before:absolute before:inset-0 before:left-7 before:w-0.5 before:bg-primary/20">
              {milestones.map((m, mIndex) => (
                <div key={mIndex} className="relative flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content font-black text-sm flex items-center justify-center shrink-0 z-10 shadow-lg group-hover:scale-105 transition-transform">
                    {m.year}
                  </div>
                  <div className="bg-base-100 border border-base-300 rounded-3xl p-8 shadow-md flex-1 group-hover:shadow-xl transition-shadow">
                    <h3 className="text-xl font-extrabold text-base-content">{m.title}</h3>
                    <p className="text-xs sm:text-sm text-base-content/70 mt-2 leading-relaxed font-medium">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* Bottom Call to Action */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-gradient-to-br from-primary/90 to-primary-focus rounded-3xl p-8 sm:p-12 lg:p-16 text-primary-content shadow-2xl relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

              <div className="space-y-4 max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase border border-white/20">
                  <Building2 className="w-3.5 h-3.5" /> Want to Test Our System in Your School?
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Ready to Join Our School Testing Cohort?
                </h2>
                <p className="text-sm sm:text-base text-primary-content/80 leading-relaxed">
                  Contact us today. Schools cannot register themselves; our super admin will create your account for you.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
                <Link 
                  to="/contact" 
                  className="btn bg-base-100 text-primary hover:bg-base-200 btn-lg rounded-2xl font-bold px-8 shadow-xl"
                >
                  Contact Us to Join
                </Link>
                <Link 
                  to="/login" 
                  className="btn btn-outline text-primary-content border-white/40 hover:bg-white/10 btn-lg rounded-2xl font-bold px-8"
                >
                  Sign In to Portal
                </Link>
              </div>

            </div>
          </div>
        </section>

      </div>

      <Footer />
    </>
  );
};

export default AboutPage;