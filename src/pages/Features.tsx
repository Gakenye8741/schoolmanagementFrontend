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

const FeaturesPage = () => {
  const coreModules = [
    {
      title: "Student Admissions & Registers",
      description: "Easily add new students, save parent contact details, and keep a neat digital record for every learner from their very first day.",
      icon: Users,
      badge: "Admissions"
    },
    {
      title: "Fee Collections & Balances",
      description: "Keep track of school fees without stress, record cash or bank payments instantly, print clear receipts, and never lose track of who has paid.",
      icon: WalletCards,
      badge: "Finance"
    },
    {
      title: "Exams & Report Cards",
      description: "Teachers can type in exam marks quickly, let the system calculate term averages automatically, and print clean report cards with zero hassle.",
      icon: GraduationCap,
      badge: "Academics"
    },
    {
      title: "Class Timetables & Setup",
      description: "Organize school periods, assign subjects to teachers smoothly, and make sure every class runs on time without schedule clashes.",
      icon: BookOpen,
      badge: "Operations"
    },
    {
      title: "Daily Roll Call & Attendance",
      description: "Mark who is present or absent in seconds, catch truancy early, and let parents know immediately if their child misses school.",
      icon: CalendarDays,
      badge: "Monitoring"
    },
    {
      title: "Discipline & Conduct Records",
      description: "Keep a fair and transparent record of student behavior and school actions so nothing falls through the cracks.",
      icon: ShieldAlert,
      badge: "Conduct"
    }
  ];

  const rolePortals = [
    {
      role: "Super Admin",
      desc: "Full control over the entire system, managing different school branches, and handling overall settings."
    },
    {
      role: "School Admin",
      desc: "Run everyday school tasks, manage teachers, handle new student admissions, and check financial summaries."
    },
    {
      role: "Teachers",
      desc: "Upload exam scores, post notes for students, check daily attendance, and chat with parents directly."
    },
    {
      role: "Students",
      desc: "Check your personal timetable, view term grades, review fee statements, and download study materials anytime."
    },
    {
      role: "Parents",
      desc: "Monitor your children's exam results, track attendance history, and check fee payment statuses easily."
    }
  ];

  return (
    <>
      <Toaster richColors position="top-right" />
      <Navbar />
      
      <div className="min-h-screen bg-base-100 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content animate-fadeIn">
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-base-200/60 via-base-100 to-base-100">
          {/* Background Decorative Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Hero Content */}
              <div className="lg:col-span-12 lg:text-center space-y-6 max-w-4xl mx-auto">
              
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-base-content">
                  Everything Your School Needs, <span className="text-primary underline decoration-primary/30 underline-offset-8">All in One Place</span>
                </h1>
                
                <p className="text-base sm:text-lg text-base-content/70 leading-relaxed max-w-2xl mx-auto font-medium">
                  Say goodbye to heavy paperwork and messy files. ElimuCloud brings student admissions, fee tracking, report cards, and user logins into one fast, easy-to-use cloud system.
                </p>

                {/* Trust Indicators */}
                <div className="pt-6 grid grid-cols-3 gap-4 border-t border-base-300/80 max-w-lg mx-auto">
                  <div>
                    <p className="text-2xl font-black text-primary">6 Core</p>
                    <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">Main Modules</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-primary">5 User</p>
                    <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">Portals</p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-primary">100%</p>
                    <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">Cloud Synced</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Core Modules Grid Section */}
        <section className="py-20 bg-base-200/40 border-y border-base-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                Core Modules
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Built for Daily School Life
              </h2>
              <p className="text-sm sm:text-base text-base-content/70">
                Simple tools designed to make running a school feel light, fast, and completely stress-free.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {coreModules.map((module, index) => {
                const IconComponent = module.icon;
                return (
                  <div 
                    key={index} 
                    className="bg-base-100 p-8 rounded-3xl shadow-xl border border-base-300 flex flex-col justify-between hover:shadow-2xl transition-all group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:bg-primary group-hover:text-primary-content transition-colors">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                          {module.badge}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-extrabold">
                        {module.title}
                      </h3>
                      
                      <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                        {module.description}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-base-200 flex items-center gap-2 text-xs font-bold text-primary">
                      <CheckCircle2 className="w-4 h-4 shrink-0" /> Always Safe &amp; Cloud Synced
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* Dedicated Portals Section */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-base-100 border border-base-300 rounded-3xl p-8 sm:p-12 shadow-xl">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {rolePortals.map((portal, idx) => (
                  <div 
                    key={idx} 
                    className="bg-base-200/50 p-6 rounded-2xl border border-base-300 shadow-sm flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div>
                      <h4 className="font-extrabold text-base text-primary mb-1">{portal.role}</h4>
                      <p className="text-xs text-base-content/70 leading-relaxed">{portal.desc}</p>
                    </div>
                    <div className="text-[10px] font-extrabold text-base-content/40 uppercase tracking-widest pt-3 border-t border-base-300/60">
                      Private Login
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-20 bg-base-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-gradient-to-br from-primary/90 to-primary-focus rounded-3xl p-8 sm:p-12 lg:p-16 text-primary-content shadow-2xl relative overflow-hidden text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
              
              {/* Background blur effects */}
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
                  Join smart schools moving away from heavy registers and messy files. Get started with ElimuCloud today.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
                <Link 
                  to="/register" 
                  className="btn bg-base-100 text-primary hover:bg-base-200 btn-lg rounded-2xl font-bold px-8 shadow-xl"
                >
                  Create School Account
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