import { 
  Users, 
  GraduationCap, 
  WalletCards, 
  BookOpen, 
  CalendarDays, 
  ShieldAlert, 
  CheckCircle2, 
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { usePageSeo } from '../hooks/usePageSeo';

const FeaturesPage = () => {
  usePageSeo({
    title: "Platform Features | Academiq Multi-Tenant School ERP",
    description: "Explore the advanced features of Academiq, including multi-tenant database isolation, automated fee collection, role-based student and parent portals, and real-time exam grading. Engineered by Brian Gakenye Ndiritu.",
    keywords: "Academiq features, school ERP system modules, student portal software, automated fee collection Kenya, multi-tenant school management software, Brian Gakenye Ndiritu"
  });

  const coreModules = [
    {
      title: "Student Admissions & Registers",
      description: "Easily add new students, save parent contact details, and keep a neat digital record for every learner from their very first day.",
      icon: Users,
      badge: "Admissions",
      image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Fee Collections & Balances",
      description: "Keep track of school fees without stress, record cash or bank payments instantly, print clear receipts, and never lose track of who has paid.",
      icon: WalletCards,
      badge: "Finance",
      image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Exams & Report Cards",
      description: "Teachers can type in exam marks quickly, let the system calculate term averages automatically, and print clean report cards with zero hassle.",
      icon: GraduationCap,
      badge: "Academics",
      image: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Class Timetables & Setup",
      description: "Organize school periods, assign subjects to teachers smoothly, and make sure every class runs on time without schedule clashes.",
      icon: BookOpen,
      badge: "Operations",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Daily Roll Call & Attendance",
      description: "Mark who is present or absent in seconds, catch truancy early, and let parents know immediately if their child misses school.",
      icon: CalendarDays,
      badge: "Monitoring",
      image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&w=800&q=80",
    },
    {
      title: "Discipline & Conduct Records",
      description: "Keep a fair and transparent record of student behavior and school actions so nothing falls through the cracks.",
      icon: ShieldAlert,
      badge: "Conduct",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80",
    }
  ];

  const rolePortals = [
    {
      role: "Super Admin",
      desc: "Full control over the entire system, managing different school branches, and handling overall settings.",
      avatar: "https://i.pravatar.cc/120?img=68",
    },
    {
      role: "School Admin",
      desc: "Run everyday school tasks, manage teachers, handle new student admissions, and check financial summaries.",
      avatar: "https://i.pravatar.cc/120?img=12",
    },
    {
      role: "Teachers",
      desc: "Upload exam scores, post notes for students, check daily attendance, and chat with parents directly.",
      avatar: "https://i.pravatar.cc/120?img=32",
    },
    {
      role: "Students",
      desc: "Check your personal timetable, view term grades, review fee statements, and download study materials anytime.",
      avatar: "https://i.pravatar.cc/120?img=5",
    },
    {
      role: "Parents",
      desc: "Monitor your children's exam results, track attendance history, and check fee payment statuses easily.",
      avatar: "https://i.pravatar.cc/120?img=45",
    }
  ];

  return (
    <>
      <Toaster richColors position="top-right" />
      <Navbar />

      {/* ───────────── Global animations ───────────── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(18px, -18px) scale(1.06); }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .anim-fade-up  { animation: fadeInUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .anim-fade-in  { animation: fadeIn 0.9s ease-out both; }
        .anim-scale-in { animation: scaleIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .anim-float    { animation: floatY 4s ease-in-out infinite; }
        .anim-orb-a    { animation: floatOrb 12s ease-in-out infinite; }
        .anim-orb-b    { animation: floatOrb 15s ease-in-out infinite reverse; }
        @media (prefers-reduced-motion: reduce) {
          .anim-fade-up, .anim-fade-in, .anim-scale-in,
          .anim-float, .anim-orb-a, .anim-orb-b {
            animation: none !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-base-100 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content overflow-x-hidden">
        
        {/* ═══════════════════════════════════════════════
            HERO SECTION — with image + animations
            ═══════════════════════════════════════════════ */}
        <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-gradient-to-b from-base-200/60 via-base-100 to-base-100">
          {/* Background orbs (animated) */}
          <div className="anim-orb-a absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="anim-orb-b absolute top-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              
              {/* Left — text content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div
                  className="anim-fade-up inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1"
                  style={{ animationDelay: "0.05s" }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest">
                    Academiq Platform Features
                  </span>
                </div>

                <h1
                  className="anim-fade-up text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-base-content"
                  style={{ animationDelay: "0.15s" }}
                >
                  Everything Your School Needs,{" "}
                  <span className="text-primary underline decoration-primary/30 underline-offset-8">
                    All in One Place
                  </span>
                </h1>
                
                <p
                  className="anim-fade-up text-base sm:text-lg text-base-content/70 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium"
                  style={{ animationDelay: "0.28s" }}
                >
                  Say goodbye to heavy paperwork and messy files. Academiq brings
                  student admissions, fee tracking, report cards, and user logins
                  into one fast, easy-to-use cloud system.
                </p>

                {/* Trust indicators */}
                <div
                  className="anim-fade-up pt-6 grid grid-cols-3 gap-4 border-t border-base-300/80 max-w-lg mx-auto lg:mx-0"
                  style={{ animationDelay: "0.42s" }}
                >
                  <div className="group cursor-default">
                    <p className="text-2xl font-black text-primary transition-colors group-hover:text-secondary">6 Core</p>
                    <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">Main Modules</p>
                  </div>
                  <div className="group cursor-default">
                    <p className="text-2xl font-black text-primary transition-colors group-hover:text-secondary">5 User</p>
                    <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">Portals</p>
                  </div>
                  <div className="group cursor-default">
                    <p className="text-2xl font-black text-primary transition-colors group-hover:text-secondary">100%</p>
                    <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">Cloud Synced</p>
                  </div>
                </div>
              </div>

              {/* Right — hero image */}
              <div
                className="lg:col-span-5 anim-scale-in relative"
                style={{ animationDelay: "0.35s" }}
              >
                {/* Main image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-base-300 group">
                  <img
                    src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80"
                    alt="Students learning in a modern classroom"
                    className="w-full h-72 sm:h-96 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-white">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-widest drop-shadow-md">
                      Trusted by 500+ schools
                    </span>
                  </div>
                </div>

                {/* Floating badge */}
                <div className="anim-float absolute -top-4 -left-4 bg-base-100 rounded-2xl shadow-xl border border-base-300 px-4 py-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-success/15 text-success flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-base-content">100% Secure</p>
                    <p className="text-[10px] text-base-content/60">Cloud Backup</p>
                  </div>
                </div>

                {/* Floating badge 2 */}
                <div
                  className="anim-float absolute -bottom-4 -right-4 bg-base-100 rounded-2xl shadow-xl border border-base-300 px-4 py-3 flex items-center gap-2.5"
                  style={{ animationDelay: "1.5s" }}
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-base-content">5 Portals</p>
                    <p className="text-[10px] text-base-content/60">One System</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            CORE MODULES — with image headers
            ═══════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20 bg-base-200/40 border-y border-base-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <span className="anim-fade-up inline-block text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Core Modules
              </span>
              <h2
                className="anim-fade-up text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ animationDelay: "0.08s" }}
              >
                Built for Daily School Life
              </h2>
              <p
                className="anim-fade-up text-sm sm:text-base text-base-content/70"
                style={{ animationDelay: "0.16s" }}
              >
                Simple tools designed to make running a school feel light, fast, and completely stress-free.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {coreModules.map((module, index) => {
                const IconComponent = module.icon;
                return (
                  <div 
                    key={index} 
                    className="anim-fade-up group bg-base-100 rounded-3xl shadow-xl border border-base-300 overflow-hidden flex flex-col hover:shadow-2xl hover:-translate-y-1.5 hover:border-primary/40 transition-all duration-300"
                    style={{ animationDelay: `${0.08 + index * 0.08}s` }}
                  >
                    {/* Image header */}
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={module.image}
                        alt={module.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                      {/* Badge on top of image */}
                      <span className="absolute top-3 right-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-base-100/95 backdrop-blur-md text-primary uppercase tracking-wider shadow-sm">
                        {module.badge}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col flex-1 justify-between p-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:bg-primary group-hover:text-primary-content transition-colors duration-300 group-hover:rotate-6">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-extrabold leading-tight">
                            {module.title}
                          </h3>
                        </div>
                        
                        <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                          {module.description}
                        </p>
                      </div>

                      <div className="pt-5 mt-5 border-t border-base-200 flex items-center gap-2 text-xs font-bold text-primary">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> Always Safe &amp; Cloud Synced
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            ROLE PORTALS — with avatar images
            ═══════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="anim-scale-in bg-base-100 border border-base-300 rounded-3xl p-8 sm:p-12 shadow-xl">
              <div className="max-w-2xl mb-12">
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Role-Based Access
                </span>
                <h2 className="text-3xl font-extrabold tracking-tight text-base-content mt-3">
                  A Custom Dashboard for Every Desk
                </h2>
                <p className="text-sm sm:text-base text-base-content/70 mt-2">
                  No clutter. Every user logs into a clean screen built specifically for what they need to do each day.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {rolePortals.map((portal, idx) => (
                  <div 
                    key={idx} 
                    className="anim-fade-up group bg-base-200/50 p-5 rounded-2xl border border-base-300 shadow-sm flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:border-primary/40 hover:bg-base-100"
                    style={{ animationDelay: `${0.08 + idx * 0.08}s` }}
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      {/* Avatar image */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:border-primary/50">
                          <img
                            src={portal.avatar}
                            alt={`${portal.role} avatar`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-base-100 shadow-sm" />
                      </div>

                      <h4 className="font-extrabold text-base text-primary">{portal.role}</h4>
                      <p className="text-xs text-base-content/70 leading-relaxed">{portal.desc}</p>
                    </div>

                    <div className="text-[10px] font-extrabold text-base-content/40 uppercase tracking-widest pt-3 border-t border-base-300/60 text-center group-hover:text-primary/70 transition-colors">
                      Private Login
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════
            CTA BANNER
            ═══════════════════════════════════════════════ */}
        <section className="py-16 lg:py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="anim-scale-in bg-gradient-to-br from-primary/90 to-primary-focus rounded-3xl p-8 sm:p-12 lg:p-16 text-primary-content shadow-2xl relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
              
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none"></div>

              <div className="space-y-4 max-w-2xl relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold uppercase border border-white/20">
                  <Building2 className="w-3.5 h-3.5" /> Ready to take your institution digital?
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                  Ready to Upgrade Your School Experience?
                </h2>
                <p className="text-sm sm:text-base text-primary-content/80 leading-relaxed">
                  Join smart schools moving away from heavy registers and messy files. Get started with Academiq today.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
                <Link 
                  to="/register" 
                  className="group btn bg-base-100 text-primary hover:bg-base-200 btn-lg rounded-2xl font-bold px-8 shadow-xl"
                >
                  Create School Account
                  <CheckCircle2 className="w-4 h-4 ml-1 transition-transform group-hover:scale-110" />
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

        <Footer />
      </div>
    </>
  );
};

export default FeaturesPage;