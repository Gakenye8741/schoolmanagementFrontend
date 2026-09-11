import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useGetSchoolByIdQuery } from '../features/Apis/School.Api';
import { Navbar } from '../components/Navbar';
import { Building2, MapPin, Award, UserCheck, ShieldCheck, ArrowRight, Bell, Calendar, Sparkles, FileText, Users, DollarSign, CheckCircle2, Zap, Lock, Globe, Layers, Server, Activity } from 'lucide-react';
import type { RootState } from '../App/store';

const Home = () => {
  const { user, isAuthenticated, role } = useSelector((state: RootState) => state.auth);

  const schoolId = user?.schoolId || user?.user?.schoolId;

  const { data: school, isLoading, error } = useGetSchoolByIdQuery(schoolId, {
    skip: !isAuthenticated || !schoolId || role === 'super_admin',
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-base-200 text-base-content flex flex-col pt-16 animate-fadeIn">
        <Navbar />
        {/* Hero Section */}
        <div className="hero flex-grow bg-base-100 py-12 md:py-20 px-4 sm:px-6">
          <div className="hero-content text-center max-w-4xl w-full">
            <div className="space-y-6 animate-slideUp">
              <span className="badge badge-primary badge-outline text-xs sm:text-sm px-4 py-2 uppercase tracking-widest font-bold animate-pulse">
                Multi-Tenant School Management Platform
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
                Empowering Institutions with <span className="text-primary">Smart Administration</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-base-content/70 max-w-2xl mx-auto">
                A robust, secure, and dynamic portal built to seamlessly manage students, teachers, fee tracking, examinations, and institutional workflows across multiple campuses.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 w-full sm:w-auto">
                <Link to="/LOgin" className="btn btn-primary px-8 text-base sm:text-lg w-full sm:w-auto transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  🔐 Login to Portal <ArrowRight size={20} className="transition-transform duration-300 hover:translate-x-1" />
                </Link>
                <Link to="/About" className="btn btn-outline px-8 text-base sm:text-lg w-full sm:w-auto transition-all duration-300 hover:scale-105">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <section className="py-16 md:py-20 px-4 sm:px-6 bg-base-200/50 border-t border-base-300">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Why Choose Our Platform?</h2>
              <p className="text-sm sm:text-base text-base-content/70">Engineered to streamline every aspect of academic and financial operations for modern institutions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="card bg-base-100 shadow-sm border border-base-300 p-6 sm:p-8 space-y-4 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold transition-transform duration-300 hover:rotate-12">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold">Real-Time Synchronization</h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Instantly sync student enrollments, attendance registers, and fee transaction updates across all administrative departments without delay.
                </p>
              </div>

              <div className="card bg-base-100 shadow-sm border border-base-300 p-6 sm:p-8 space-y-4 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold transition-transform duration-300 hover:rotate-12">
                  <Lock size={24} />
                </div>
                <h3 className="text-xl font-bold">Role-Based Security</h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Granular access control tailored for super admins, school administrators, bursars, teachers, parents, and students to protect sensitive data.
                </p>
              </div>

              <div className="card bg-base-100 shadow-sm border border-base-300 p-6 sm:p-8 space-y-4 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold transition-transform duration-300 hover:rotate-12">
                  <Globe size={24} />
                </div>
                <h3 className="text-xl font-bold">Multi-Tenant Architecture</h3>
                <p className="text-sm text-base-content/70 leading-relaxed">
                  Custom branding, isolated databases, localized currencies, and distinct regional configurations designed for individual campus needs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Overview */}
        <section className="py-16 md:py-20 px-4 sm:px-6 bg-base-100 border-t border-base-300">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
            <div className="space-y-6">
              <span className="badge badge-secondary badge-outline text-xs font-bold uppercase tracking-wider">Comprehensive Suite</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Everything your institution needs in a single unified ecosystem.</h2>
              <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
                Eliminate fragmented spreadsheets and legacy software. Our platform brings automated grade processing, digital fee tracking, KNEC reporting compliance, and secure parent communication portals together.
              </p>
              <ul className="space-y-3 font-medium text-sm">
                <li className="flex items-center gap-3 transition-transform duration-200 hover:translate-x-1"><CheckCircle2 size={18} className="text-success shrink-0" /> Automated Fee Collection & Ledger Balances</li>
                <li className="flex items-center gap-3 transition-transform duration-200 hover:translate-x-1"><CheckCircle2 size={18} className="text-success shrink-0" /> Dynamic Report Card & Transcript Generation</li>
                <li className="flex items-center gap-3 transition-transform duration-200 hover:translate-x-1"><CheckCircle2 size={18} className="text-success shrink-0" /> Secure Portal Access for Parents and Students</li>
                <li className="flex items-center gap-3 transition-transform duration-200 hover:translate-x-1"><CheckCircle2 size={18} className="text-success shrink-0" /> Institutional Customization & Theme Control</li>
              </ul>
            </div>
            <div className="card bg-base-200 border border-base-300 p-6 sm:p-8 rounded-3xl shadow-md space-y-6 transition-all duration-300 hover:shadow-xl">
              <h3 className="text-xl font-bold">Ready to digitize your campus?</h3>
              <p className="text-sm text-base-content/70">Access your institution's portal now with your assigned credentials or get in touch with our team to onboard your school.</p>
              <div className="flex flex-col gap-3">
                <Link to="/LOgin" className="btn btn-primary w-full transition-all duration-300 hover:scale-[1.02]">Access Portal Now</Link>
                <Link to="/About" className="btn btn-outline w-full transition-all duration-300 hover:scale-[1.02]">Learn More About Features</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Super Admin System-Wide Overview View
  if (role === 'super_admin') {
    return (
      <div className="min-h-screen bg-base-200 text-base-content overflow-x-hidden pt-16 animate-fadeIn">
        <Navbar />

        <header className="relative text-white p-6 sm:p-8 md:py-12 shadow-xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 animate-slideDown">
          <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-3xl font-bold shadow-2xl backdrop-blur-md shrink-0 transition-transform duration-500 hover:rotate-6">
                ⚡
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="badge badge-sm uppercase bg-primary text-primary-content font-bold tracking-wider border-none">
                    Global System Superuser
                  </span>
                  <span className="badge badge-sm badge-outline text-white border-white/30 font-semibold">
                    Multi-Tenant Control Panel
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm">ElimuHub Platform Hub</h1>
                <p className="text-xs sm:text-sm italic opacity-80 mt-1">"Centralized administrative oversight and tenant infrastructure management."</p>
              </div>
            </div>

            <div className="bg-black/40 backdrop-blur-md px-4 sm:px-6 py-4 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-4 shadow-lg w-full lg:w-auto">
              <div className="text-left sm:text-right">
                <p className="font-bold text-sm sm:text-base">{user.name || user.username || 'Super Admin'}</p>
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-primary font-bold">
                  Super Administrator Access
                </span>
              </div>
              <Link to="/Admindashboard" className="btn btn-sm btn-primary font-bold shadow-md hover:scale-105 transition-transform w-full sm:w-auto text-center">
                System Dashboard <ArrowRight size={16} className="transition-transform duration-300 hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </header>

        {/* Sub-Navbar Status Strip */}
        <div className="bg-base-100 border-b border-base-300 shadow-sm overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-nowrap items-center justify-between gap-4 min-w-[max-content] sm:min-w-0">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-base-content/70">
              <span className="flex items-center gap-1.5 font-medium whitespace-nowrap"><Calendar size={16} className="text-primary" /> Core Engine: v2.6.0</span>
              <span className="hidden md:inline">•</span>
              <span className="flex items-center gap-1.5 font-medium whitespace-nowrap"><Activity size={16} className="text-success animate-pulse" /> Infrastructure: 100% Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/Admindashboard" className="btn btn-ghost btn-xs gap-1 font-semibold transition-colors hover:bg-base-200"><Server size={14} /> Tenants</Link>
              <Link to="/Admindashboard" className="btn btn-ghost btn-xs gap-1 font-semibold transition-colors hover:bg-base-200"><ShieldCheck size={14} /> Security Logs</Link>
              <Link to="/Admindashboard" className="btn btn-ghost btn-xs gap-1 font-semibold transition-colors hover:bg-base-200"><Globe size={14} /> Global Metrics</Link>
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="stat bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-base-300 border-t-4 border-t-primary">
              <div className="stat-figure p-3 rounded-xl bg-primary/10 text-primary transition-transform duration-300 hover:scale-110"><Layers size={24} /></div>
              <div className="stat-title font-medium text-xs uppercase tracking-wider">Architecture</div>
              <div className="stat-value text-xl sm:text-2xl mt-1">Multi-Tenant</div>
              <div className="stat-desc text-xs mt-1">Isolated Databases & Themes</div>
            </div>

            <div className="stat bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-base-300 border-t-4 border-t-secondary">
              <div className="stat-figure p-3 rounded-xl bg-warning/10 text-secondary transition-transform duration-300 hover:scale-110"><Globe size={24} /></div>
              <div className="stat-title font-medium text-xs uppercase tracking-wider">Environment</div>
              <div className="stat-value text-xl sm:text-2xl mt-1">Production</div>
              <div className="stat-desc text-xs mt-1">Timezone: Africa/Nairobi</div>
            </div>

            <div className="stat bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-base-300 border-t-4 border-t-primary">
              <div className="stat-figure p-3 rounded-xl bg-primary/10 text-primary transition-transform duration-300 hover:scale-110"><ShieldCheck size={24} /></div>
              <div className="stat-title font-medium text-xs uppercase tracking-wider">Access Rights</div>
              <div className="stat-value text-xl sm:text-2xl uppercase mt-1">Full Control</div>
              <div className="stat-desc text-success font-semibold mt-1">Status: Verified Superuser</div>
            </div>

            <div className="stat bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-base-300 border-t-4 border-t-secondary">
              <div className="stat-figure p-3 rounded-xl bg-warning/10 text-secondary transition-transform duration-300 hover:scale-110"><Activity size={24} /></div>
              <div className="stat-title font-medium text-xs uppercase tracking-wider">API Gateway</div>
              <div className="stat-value text-xl sm:text-2xl mt-1">Connected</div>
              <div className="stat-desc text-xs mt-1">Redux Query Synchronized</div>
            </div>
          </div>

          {/* System Overview Content Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-sm border border-base-300 p-5 sm:p-6 space-y-4 rounded-2xl transition-all duration-300 hover:shadow-md">
              <h3 className="text-base sm:text-lg font-bold border-b pb-3 flex items-center gap-2.5 text-primary">
                <Server size={20} className="shrink-0" /> Global Platform Management
              </h3>
              <p className="text-xs sm:text-sm text-base-content/80 leading-relaxed">
                As a super administrator, you have global oversight across all registered educational institutions on the ElimuHub platform. You can manage system-wide parameters, verify school subscriptions, monitor database health, and oversee user role allocations.
              </p>
              <div className="pt-2">
                <Link to="/Admindashboard" className="btn btn-primary btn-sm w-full font-bold transition-all duration-300 hover:scale-[1.01]">
                  Open Master Admin Console <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-300 p-5 sm:p-6 space-y-4 rounded-2xl transition-all duration-300 hover:shadow-md">
              <h3 className="text-base sm:text-lg font-bold border-b pb-3 flex items-center gap-2.5 text-primary">
                <Sparkles size={20} className="shrink-0" /> Quick System Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <Link to="/Admindashboard" className="p-3 rounded-xl bg-base-200 hover:bg-base-300 transition-all duration-200 hover:translate-x-1 flex items-center gap-3 font-semibold">
                  <Building2 size={18} className="text-primary" /> Onboard Institution
                </Link>
                <Link to="/Admindashboard" className="p-3 rounded-xl bg-base-200 hover:bg-base-300 transition-all duration-200 hover:translate-x-1 flex items-center gap-3 font-semibold">
                  <Users size={18} className="text-primary" /> Manage User Roles
                </Link>
                <Link to="/Admindashboard" className="p-3 rounded-xl bg-base-200 hover:bg-base-300 transition-all duration-200 hover:translate-x-1 flex items-center gap-3 font-semibold">
                  <DollarSign size={18} className="text-primary" /> Subscriptions & Billing
                </Link>
                <Link to="/Admindashboard" className="p-3 rounded-xl bg-base-200 hover:bg-base-300 transition-all duration-200 hover:translate-x-1 flex items-center gap-3 font-semibold">
                  <ShieldCheck size={18} className="text-primary" /> Audit Logs
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
        <Navbar />
        <div className="flex flex-col items-center justify-center space-y-6 animate-fadeIn">
          {/* Customized Dual-Ring Pulse Spinner with Institution Vibe */}
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
            <div className="absolute inset-2 rounded-full border-4 border-t-primary border-r-transparent border-b-secondary border-l-transparent animate-spin"></div>
            <div className="absolute inset-6 rounded-full bg-primary/10 flex items-center justify-center shadow-inner">
              <Building2 className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-bold tracking-tight text-base-content animate-pulse">
              Loading Institutional Workspace...
            </h3>
            <p className="text-xs text-base-content/60 font-medium">
              Synchronizing secure tenant parameters &amp; academic records
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 text-center p-4 sm:p-6 pt-16 animate-fadeIn">
        <Navbar />
        <div className="mt-12 card bg-base-100 p-6 sm:p-8 shadow-xl max-w-md w-full border border-base-300 animate-slideUp">
          <h2 className="text-xl sm:text-2xl font-bold text-error mb-2">School Profile Missing</h2>
          <p className="text-sm sm:text-base text-base-content/70 mb-4">
            You are logged in as <span className="font-semibold">{user.name || user.username || 'User'}</span> ({role || 'User'}), but your account is not linked to an active school ID (`{schoolId || 'None found'}`).
          </p>
          <Link to="/Admindashboard" className="btn btn-primary w-full transition-all duration-300 hover:scale-[1.02]">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-base-200 text-base-content overflow-x-hidden pt-16 animate-fadeIn"
      style={{
        '--school-primary': school.primaryColor || '#0F172A',
        '--school-secondary': school.secondaryColor || '#F59E0B',
      } as React.CSSProperties}
    >
      <Navbar />

      <header 
        className="relative text-white p-6 sm:p-8 md:py-12 shadow-xl overflow-hidden transition-colors duration-300 animate-slideDown"
        style={{ 
          background: `linear-gradient(135deg, var(--school-primary) 0%, color-mix(in srgb, var(--school-primary) 70%, #000000) 100%)` 
        }}
      >
        {school.logoUrl && (
          <div className="absolute right-[-20px] bottom-[-40px] opacity-10 pointer-events-none hidden sm:block transition-transform duration-700 hover:scale-110">
            <img src={school.logoUrl} alt="" className="w-64 md:w-96 h-64 md:h-96 object-contain" />
          </div>
        )}

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-5 w-full lg:w-auto">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="School Logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 object-cover shadow-2xl border-2 border-white/20 shrink-0 transition-transform duration-300 hover:scale-105" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 flex items-center justify-center text-3xl font-bold shadow backdrop-blur-sm shrink-0 transition-transform duration-300 hover:rotate-6">
                🏫
              </div>
            )}
            <div className="w-full">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="badge badge-sm uppercase bg-white/20 text-white font-semibold tracking-wider border-none backdrop-blur-md">
                  Verified Institution
                </span>
                {['super_admin', 'school_admin', 'bursar'].includes(role || '') && (
                  <span className="badge badge-sm border-none text-slate-900 font-bold" style={{ backgroundColor: 'var(--school-secondary)' }}>
                    {school.subscriptionPlan} Plan
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-sm break-words">{school.name}</h1>
              <p className="text-xs sm:text-sm italic opacity-90 mt-1 max-w-xl">"{school.motto}"</p>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-md px-4 sm:px-6 py-4 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between lg:justify-end gap-4 shadow-lg w-full lg:w-auto">
            <div className="text-left sm:text-right">
              <p className="font-bold text-sm sm:text-base">{user.name || user.username || 'User'}</p>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest opacity-80 font-medium">
                {role?.replace('_', ' ') || 'User'} Access
              </span>
            </div>
            <Link to="/Admindashboard" className="btn btn-sm text-slate-900 border-none font-bold shadow-md hover:scale-105 transition-all duration-300 w-full sm:w-auto text-center" style={{ backgroundColor: 'var(--school-secondary)' }}>
              Open Dashboard <ArrowRight size={16} className="transition-transform duration-300 hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* Sub-Navbar Status Strip */}
      <div className="bg-base-100 border-b border-base-300 shadow-sm overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-nowrap items-center justify-between gap-4 min-w-[max-content] sm:min-w-0">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-base-content/70">
            <span className="flex items-center gap-1.5 font-medium whitespace-nowrap"><Calendar size={16} className="text-primary" /> Academic Year: 2026</span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1.5 font-medium whitespace-nowrap"><Bell size={16} className="text-warning animate-bounce" /> System Status: Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/Admindashboard" className="btn btn-ghost btn-xs gap-1 font-semibold transition-colors hover:bg-base-200"><Users size={14} /> Students</Link>
            <Link to="/Admindashboard" className="btn btn-ghost btn-xs gap-1 font-semibold transition-colors hover:bg-base-200"><DollarSign size={14} /> Fee Ledger</Link>
            <Link to="/Admindashboard" className="btn btn-ghost btn-xs gap-1 font-semibold transition-colors hover:bg-base-200"><FileText size={14} /> Reports</Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-base-300 border-t-4" style={{ borderTopColor: 'var(--school-primary)' }}>
            <div className="stat-figure p-3 rounded-xl bg-primary/10 transition-transform duration-300 hover:scale-110" style={{ color: 'var(--school-primary)' }}><Building2 size={24} /></div>
            <div className="stat-title font-medium text-xs uppercase tracking-wider">Curriculum Type</div>
            <div className="stat-value text-xl sm:text-2xl mt-1">{school.curriculumType || 'CBC'}</div>
            <div className="stat-desc text-xs mt-1">System: {school.schoolType || 'High School'}</div>
          </div>

          <div className="stat bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-base-300 border-t-4" style={{ borderTopColor: 'var(--school-secondary)' }}>
            <div className="stat-figure p-3 rounded-xl bg-warning/10 transition-transform duration-300 hover:scale-110" style={{ color: 'var(--school-secondary)' }}><UserCheck size={24} /></div>
            <div className="stat-title font-medium text-xs uppercase tracking-wider">Principal</div>
            <div className="stat-value text-lg sm:text-xl truncate mt-1">{school.principalName || 'Principal'}</div>
            <div className="stat-desc text-xs mt-1">Established {school.establishedYear || 'N/A'}</div>
          </div>

          {['super_admin', 'school_admin', 'bursar'].includes(role || '') ? (
            <div className="stat bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-base-300 border-t-4" style={{ borderTopColor: 'var(--school-primary)' }}>
              <div className="stat-figure p-3 rounded-xl bg-primary/10 transition-transform duration-300 hover:scale-110" style={{ color: 'var(--school-primary)' }}><Award size={24} /></div>
              <div className="stat-title font-medium text-xs uppercase tracking-wider">Subscription Tier</div>
              <div className="stat-value text-xl sm:text-2xl uppercase mt-1">{school.subscriptionPlan || 'Active'}</div>
              <div className="stat-desc text-success font-semibold mt-1">Status: {school.subscriptionStatus || 'Active'}</div>
            </div>
          ) : (
            <div className="stat bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-base-300 border-t-4" style={{ borderTopColor: 'var(--school-primary)' }}>
              <div className="stat-figure p-3 rounded-xl bg-primary/10 transition-transform duration-300 hover:scale-110" style={{ color: 'var(--school-primary)' }}><Award size={24} /></div>
              <div className="stat-title font-medium text-xs uppercase tracking-wider">Account Status</div>
              <div className="stat-value text-xl sm:text-2xl uppercase mt-1">Active</div>
              <div className="stat-desc text-success font-semibold mt-1">Role: {role?.replace('_', ' ') || 'User'}</div>
            </div>
          )}

          <div className="stat bg-base-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-base-300 border-t-4" style={{ borderTopColor: 'var(--school-secondary)' }}>
            <div className="stat-figure p-3 rounded-xl bg-warning/10 transition-transform duration-300 hover:scale-110" style={{ color: 'var(--school-secondary)' }}><ShieldCheck size={24} /></div>
            <div className="stat-title font-medium text-xs uppercase tracking-wider">KNEC / Reg Code</div>
            <div className="stat-value text-xl sm:text-2xl mt-1">{school.knecCode || 'N/A'}</div>
            <div className="stat-desc text-xs mt-1">Ref: {school.registrationNumber || 'N/A'}</div>
          </div>
        </div>

        {/* Content Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-sm border border-base-300 p-5 sm:p-6 space-y-4 rounded-2xl transition-all duration-300 hover:shadow-md">
            <h3 className="text-base sm:text-lg font-bold border-b pb-3 flex items-center gap-2.5" style={{ color: 'var(--school-primary)' }}>
              <MapPin size={20} className="shrink-0" /> Contact & Institutional Location
            </h3>
            <ul className="space-y-3.5 text-base-content/80 text-xs sm:text-sm">
              <li className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-base-200/60 gap-1 sm:gap-0 transition-colors hover:bg-base-200/30 px-2 rounded">
                <span className="font-semibold text-base-content/60">Physical Address</span>
                <span className="font-medium text-left sm:text-right">{school.address || 'Kenya'}, {school.subCounty || ''}, {school.county || ''}</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-base-200/60 transition-colors hover:bg-base-200/30 px-2 rounded">
                <span className="font-semibold text-base-content/60">Phone Contact</span>
                <span className="font-medium">{school.phone || 'N/A'}</span>
              </li>
              <li className="flex items-center justify-between py-1 border-b border-base-200/60 transition-colors hover:bg-base-200/30 px-2 rounded">
                <span className="font-semibold text-base-content/60">Official Email</span>
                <span className="font-medium truncate max-w-[200px] sm:max-w-none">{school.email || 'N/A'}</span>
              </li>
              <li className="flex items-center justify-between py-1 transition-colors hover:bg-base-200/30 px-2 rounded">
                <span className="font-semibold text-base-content/60">Web Portal</span>
                <a href={school.website || '#'} target="_blank" rel="noreferrer" className="underline font-semibold hover:opacity-85 truncate max-w-[200px] sm:max-w-none" style={{ color: 'var(--school-primary)' }}>
                  {school.website || 'N/A'}
                </a>
              </li>
            </ul>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300 p-5 sm:p-6 space-y-4 rounded-2xl transition-all duration-300 hover:shadow-md">
            <h3 className="text-base sm:text-lg font-bold border-b pb-3 flex items-center gap-2.5" style={{ color: 'var(--school-primary)' }}>
              <Sparkles size={20} className="shrink-0" /> System Branding & Regional Config
            </h3>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-1 border-b border-base-200/60 transition-colors hover:bg-base-200/30 px-2 rounded">
                <span className="font-semibold text-base-content/60">Primary Brand Palette</span>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full shadow-inner border shrink-0 transition-transform hover:scale-125" style={{ backgroundColor: school.primaryColor || '#0F172A' }}></span>
                  <span className="font-mono text-xs font-bold">{school.primaryColor || '#0F172A'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-base-200/60 transition-colors hover:bg-base-200/30 px-2 rounded">
                <span className="font-semibold text-base-content/60">Secondary Accent Palette</span>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full shadow-inner border shrink-0 transition-transform hover:scale-125" style={{ backgroundColor: school.secondaryColor || '#F59E0B' }}></span>
                  <span className="font-mono text-xs font-bold">{school.secondaryColor || '#F59E0B'}</span>
                </div>
              </div>
              {['super_admin', 'school_admin', 'bursar'].includes(role || '') && (
                <div className="flex items-center justify-between py-1 border-b border-base-200/60 transition-colors hover:bg-base-200/30 px-2 rounded">
                  <span className="font-semibold text-base-content/60">Base Currency</span>
                  <span className="badge badge-neutral font-bold text-xs">{school.currency || 'KES'}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-1 transition-colors hover:bg-base-200/30 px-2 rounded">
                <span className="font-semibold text-base-content/60">Timezone Context</span>
                <span className="font-medium text-xs">{school.timezone || 'Africa/Nairobi'}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;