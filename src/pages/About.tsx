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
  Code2,
  CheckCircle2,
  Database,
  Lock,
  Zap,
  TrendingUp,
  Award,
  Mail,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Footer } from '../components/Footer';
import { usePageSeo } from '../hooks/usePageSeo';

const AboutPage = () => {
  usePageSeo({
    title: "About Academiq | School Management System by Brian Gakenye Ndiritu & Brian Ireri",
    description: "Learn about Academiq, a school management system built by two full-stack developers — Brian Gakenye Ndiritu (Project Lead) and Brian Ireri. Safe, fast, and made for Kenyan schools.",
    keywords: "about Academiq, Brian Gakenye Ndiritu, Brian Ireri, school management system Kenya, school ERP, school software"
  });

  const stats = [
    { label: "Pilot Schools", value: "15+" },
    { label: "Student Accounts", value: "5,000+" },
    { label: "Teachers Testing", value: "400+" },
    { label: "System Uptime", value: "99.9%" }
  ];

  const values = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-primary" />,
      title: "Your Data Is Safe",
      description: "Student records and money records are locked with strong security. We back up your data every day, so nothing gets lost.",
      bullets: ["Strong encryption", "Daily cloud backups", "Only the right people can see data"]
    },
    {
      icon: <Sparkles className="w-6 h-6 text-primary" />,
      title: "Easy to Use",
      description: "We turn hard school work into simple screens. Teachers and admins learn it in minutes — no training needed.",
      bullets: ["No training needed", "Clean, simple screens", "Report cards in one click"]
    },
    {
      icon: <HeartHandshake className="w-6 h-6 text-primary" />,
      title: "We Listen to You",
      description: "We work closely with schools during testing. Your feedback shapes what we build next.",
      bullets: ["New features every week", "Talk to the developers directly", "Pilot schools help decide"]
    },
    {
      icon: <Cpu className="w-6 h-6 text-primary" />,
      title: "Tested to Be Reliable",
      description: "We test every part of the system — from fee tracking to parent alerts — so it works well every school day.",
      bullets: ["Tested with 10,000 users", "We watch it 24/7", "99.9% uptime goal"]
    }
  ];

  const milestones = [
    {
      year: "2024",
      title: "The Idea Begins",
      description: "We saw how much paperwork schools deal with every day. So we started building a simple cloud system to help.",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
      tag: "Start"
    },
    {
      year: "2025",
      title: "Building the System",
      description: "We built the database, secure logins, and automatic receipts. This is when the system took shape.",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
      tag: "Build"
    },
    {
      year: "2026",
      title: "Testing with Schools",
      description: "Real schools started using the system. We listened to their feedback and kept improving every feature.",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80",
      tag: "Testing"
    }
  ];

  const corePillars = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "School Records",
      description: "Add students, enter marks, and print report cards easily."
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Logins for Everyone",
      description: "Separate safe logins for admins, teachers, and parents."
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Clear Money Tracking",
      description: "Track school fees and print receipts with no confusion."
    }
  ];

  const techStack = [
    { icon: Database, label: "PostgreSQL", sub: "Data storage" },
    { icon: Code2, label: "React + Vite", sub: "Fast screens" },
    { icon: Lock, label: "JWT Auth", sub: "Safe logins" },
    { icon: Zap, label: "Drizzle ORM", sub: "Clean database code" },
  ];

  const highlights = [
    { label: "Never goes offline", icon: CheckCircle2 },
    { label: "Loads very fast", icon: TrendingUp },
    { label: "Made for Kenya", icon: Award },
  ];

  /* ── The two developers ── */
  const developers = [
    {
      initials: "BG",
      name: "Brian Gakenye Ndiritu",
      role: "Full-Stack Developer",
      tag: "Project Lead",
      bio: "Brian leads the Academiq project. He designs the system, builds the core features, and works directly with schools during testing to make sure everything runs smoothly.",
    },
    {
      initials: "BI",
      name: "Brian Ireri",
      role: "Full-Stack Developer",
      tag: "Systems & Data",
      bio: "Brian works on the database design, secure logins, and making sure every school's data stays separate, safe, and fast. He handles the technical testing and daily backups.",
    },
  ];

  return (
    <>
      <Toaster richColors position="top-right" />
      
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>
      <div className="h-16"></div>

      <div className="min-h-[calc(100vh-4rem)] bg-base-100 text-base-content pb-24 overflow-x-hidden font-sans">
        
        {/* ═══════════════════════════════════════════════
            HERO
            ═══════════════════════════════════════════════ */}
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden bg-gradient-to-b from-base-200/60 via-base-100 to-base-100 border-b border-base-300">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 mx-auto lg:mx-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest">
                    About Academiq
                  </span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-base-content">
                  A Simple Way to{" "}
                  <span className="text-primary underline decoration-primary/30 underline-offset-8">
                    Run Your School
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg text-base-content/70 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                  Academiq is being tested right now with real schools. It brings smart technology together with everyday school work to make things easier.
                </p>

                <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                  {highlights.map((h, i) => {
                    const Icon = h.icon;
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full bg-base-100 border border-base-300 px-3 py-1.5 text-[11px] font-bold text-base-content/80 shadow-sm"
                      >
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        {h.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-base-300 group">
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80"
                    alt="Students learning together"
                    className="w-full h-64 sm:h-80 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-widest drop-shadow-md">
                      Testing Now · 15+ Schools
                    </span>
                  </div>
                </div>

                <div className="absolute -top-4 -left-4 bg-base-100 rounded-2xl shadow-xl border border-base-300 px-4 py-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-base-content">v2.4 Live</p>
                    <p className="text-[10px] text-base-content/60">Ready to Use</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Numbers strip ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 -mt-10 relative z-20">
          <div className="bg-base-100 border border-base-300 rounded-3xl p-8 shadow-2xl grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {stats.map((stat, sIndex) => (
              <div key={sIndex} className="space-y-1 p-4 rounded-2xl bg-base-200/40 border border-base-300/60 hover:-translate-y-0.5 transition-transform">
                <p className="text-3xl sm:text-4xl font-black text-primary">{stat.value}</p>
                <p className="text-xs sm:text-sm font-bold text-base-content/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════
            MISSION + PILLARS
            ═══════════════════════════════════════════════ */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-extrabold px-3.5 py-1.5 rounded-full bg-primary/10 text-primary uppercase tracking-widest inline-block">
                  Why We Built This
                </span>
                
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  To Make School Work Easier
                </h2>
                
                <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
                  Many schools still use paper books, tally fees by hand, and struggle to make report cards. Academiq was built to replace all that with one simple, fast system that works on any device.
                </p>
                
                <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
                  While we test the system, we work hand-in-hand with real schools. Every change we make comes from real feedback from teachers, bursars, and headteachers.
                </p>

                <div className="pt-2">
                  <p className="text-[10px] uppercase tracking-widest font-extrabold text-base-content/50 mb-2">
                    Built with
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {techStack.map((t, i) => {
                      const Icon = t.icon;
                      return (
                        <div key={i} className="rounded-xl border border-base-300 bg-base-200/40 px-3 py-2 flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[11px] font-extrabold text-base-content truncate">{t.label}</p>
                            <p className="text-[9px] text-base-content/60 truncate">{t.sub}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

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
                    <h3 className="text-xl font-extrabold">What We Are Testing</h3>
                  </div>

                  <div className="space-y-4">
                    {corePillars.map((pillar, pIdx) => (
                      <div key={pIdx} className="flex items-start gap-4 p-4 rounded-2xl bg-base-100 border border-base-300/60 shadow-sm hover:shadow-md transition-shadow">
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

        {/* ═══════════════════════════════════════════════
            MEET THE TEAM — two developers
            ═══════════════════════════════════════════════ */}
        <section className="py-20 bg-base-200/40 border-y border-base-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full">
                Meet the Developers
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Two Developers, One Mission
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                Academiq was designed and built by a small team of two full-stack developers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {developers.map((dev, dIdx) => (
                <div
                  key={dIdx}
                  className="bg-base-100 border border-base-300 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col items-center text-center gap-4 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Initials avatar — swap for real photo later */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-content flex items-center justify-center shadow-2xl font-black text-3xl ring-4 ring-primary/20 group-hover:scale-105 transition-transform">
                      {dev.initials}
                    </div>
                    <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 border-2 border-base-100 flex items-center justify-center shadow-lg">
                      <Code2 className="w-4 h-4 text-white" />
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-extrabold text-base-content">{dev.name}</h3>
                    <p className="text-xs font-extrabold text-primary uppercase tracking-wider">{dev.role}</p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-[11px] bg-primary/10 text-primary font-extrabold px-3 py-1 rounded-lg">{dev.tag}</span>
                  </div>

                  <p className="text-sm text-base-content/70 leading-relaxed max-w-md">
                    {dev.bio}
                  </p>

                  <a
                    href="mailto:support@academiq.co.ke"
                    className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline pt-1"
                  >
                    <Mail className="w-3.5 h-3.5" /> support@academiq.co.ke
                  </a>
                </div>
              ))}
            </div>

            <div className="max-w-3xl mx-auto mt-8 bg-base-100 border border-base-300 rounded-2xl p-6 text-center">
              <p className="text-sm text-base-content/70 leading-relaxed">
                Together, we handle everything — from writing the code to answering your calls. When you talk to us during testing, you are talking directly to the people building the system.
              </p>
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            CORE VALUES
            ═══════════════════════════════════════════════ */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full">
                What We Believe
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                What Matters to Us
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                Everything we build is based on trust, safety, and being easy to use.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((val, vIndex) => (
                <div 
                  key={vIndex}
                  className="bg-base-200/50 border border-base-300 rounded-3xl p-7 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {val.icon}
                    </div>
                    <h3 className="text-lg font-extrabold text-base-content group-hover:text-primary transition-colors">{val.title}</h3>
                    <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">{val.description}</p>

                    <ul className="space-y-1.5 pt-2 border-t border-base-300/60">
                      {val.bullets.map((b, bi) => (
                        <li key={bi} className="flex items-start gap-1.5 text-[11px] text-base-content/70">
                          <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            JOURNEY TIMELINE
            ═══════════════════════════════════════════════ */}
        <section className="py-20 bg-base-200/40 border-y border-base-300">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center mb-16 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1.5 rounded-full">
                Our Story
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                How We Got Here
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                From a simple idea to a working system used by real schools.
              </p>
            </div>

            <div className="space-y-8 relative before:absolute before:inset-0 before:left-7 before:w-0.5 before:bg-primary/20">
              {milestones.map((m, mIndex) => (
                <div key={mIndex} className="relative flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content font-black text-sm flex items-center justify-center shrink-0 z-10 shadow-lg group-hover:scale-105 transition-transform">
                    {m.year}
                  </div>
                  <div className="bg-base-100 border border-base-300 rounded-3xl shadow-md overflow-hidden flex-1 group-hover:shadow-xl transition-shadow">
                    <div className="grid grid-cols-1 sm:grid-cols-3">
                      <div className="relative h-32 sm:h-full min-h-[128px] overflow-hidden">
                        <img
                          src={m.image}
                          alt={m.title}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <span className="absolute top-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-base-100/95 backdrop-blur-md text-primary uppercase tracking-wider">
                          {m.tag}
                        </span>
                      </div>
                      <div className="sm:col-span-2 p-6 sm:p-8">
                        <h3 className="text-xl font-extrabold text-base-content">{m.title}</h3>
                        <p className="text-xs sm:text-sm text-base-content/70 mt-2 leading-relaxed font-medium">{m.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            CTA
            ═══════════════════════════════════════════════ */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-gradient-to-br from-primary/90 to-primary-focus rounded-3xl p-8 sm:p-12 lg:p-16 text-primary-content shadow-2xl relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

              <div className="space-y-4 max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase border border-white/20">
                  <Building2 className="w-3.5 h-3.5" /> Want to Try It in Your School?
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Ready to Test the System with Us?
                </h2>
                <p className="text-sm sm:text-base text-primary-content/80 leading-relaxed">
                  Just contact us. Schools cannot sign up on their own — our admin will create your account for you.
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