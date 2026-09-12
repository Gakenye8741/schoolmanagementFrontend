import { 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  BarChart3, 
  Users, 
  Zap,
  ChevronRight,
  Building,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../App/store";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { usePageSeo } from "../hooks/usePageSeo";

const Home = () => {
  usePageSeo({
    title: "Smart Multi-Tenant School Management Platform | ElimuCloud",
    description: "ElimuCloud unifies student registration, fee collections, grade tracking, and role-based portals into a single, lightning-fast cloud workspace for modern educational institutions. Conceptualized and engineered by full-stack developer Brian Gakenye Ndiritu.",
    keywords: "school management system, school software Kenya, multi-tenant school ERP, student portal, fee collection software, ElimuCloud, Brian Gakenye Ndiritu"
  });

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.role);

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-base-200/60 via-base-100 to-base-100">
        {/* Background Decorative Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
             
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-base-content">
                Smart Management for <span className="text-primary underline decoration-primary/30 underline-offset-8">Modern Schools</span>
              </h1>
              
              <p className="text-base sm:text-lg text-base-content/70 leading-relaxed max-w-2xl font-medium">
                ElimuCloud unifies student registration, fee collections, grade tracking, and role-based portals into a single, lightning-fast cloud workspace.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                {isAuthenticated ? (
                  <Link 
                    to={
                      role === 'super_admin' ? '/superAdmindashboard/AllUsers' :
                      role === 'school_admin' ? '/schoolAdmindashboard' :
                      role === 'teacher' ? '/teacherdashboard' :
                      role === 'bursar' ? '/bursar-dashboard' :
                      role === 'student' ? '/studentdashboard' :
                      role === 'parent' ? '/parentdashboard' : '/dashboard'
                    }
                    className="btn btn-primary btn-lg rounded-2xl font-bold px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2"
                  >
                    Go to Dashboard <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="btn btn-primary btn-lg rounded-2xl font-bold px-8 shadow-lg shadow-primary/20 hover:scale-105 transition-all gap-2"
                    >
                      Login to Portal <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link 
                      to="/register" 
                      className="btn btn-outline btn-lg rounded-2xl font-bold px-8 hover:bg-base-200 transition-all border-base-300"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-base-300/80 max-w-lg">
                <div>
                  <p className="text-2xl font-black text-primary">99.9%</p>
                  <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">Uptime SLA</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-primary">256-bit</p>
                  <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">Encryption</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-primary">24/7</p>
                  <p className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">Support</p>
                </div>
              </div>
            </div>

            {/* Hero Visual Card / Logged In School Details Card */}
            <div className="lg:col-span-5">
              {isAuthenticated ? (
                /* School & User Details Card when Logged In */
                <div className="bg-base-100 shadow-2xl rounded-3xl p-6 sm:p-8 border border-primary/30 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-bl-2xl">
                    Active Session
                  </div>

                  <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-base-200">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-primary-content flex items-center justify-center font-bold shadow-md">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-base-content">
                        {user?.schoolName || user?.school?.name || "ElimuCloud Institution"}
                      </h3>
                      <p className="text-xs text-primary font-semibold uppercase tracking-wider">
                        {role?.replace('_', ' ')} Portal
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="p-3.5 rounded-2xl bg-base-200/60 flex items-center justify-between border border-base-300/60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-base-content">Logged In User</p>
                          <p className="text-[11px] text-base-content/70">{user?.username || user?.email || "Authorized Member"}</p>
                        </div>
                      </div>
                      <span className="badge badge-primary badge-sm font-bold">Online</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-base-200/60 flex items-center justify-between border border-base-300/60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-success/20 text-success flex items-center justify-center font-bold text-xs">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-base-content">Account Status</p>
                          <p className="text-[11px] text-base-content/70">Verified &amp; Secure Cloud Access</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-success">Active</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-base-200/60 flex items-center justify-between border border-base-300/60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-warning/20 text-warning flex items-center justify-center font-bold text-xs">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-base-content">System Environment</p>
                          <p className="text-[11px] text-base-content/70">Production Multi-Tenant Cluster</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-warning">v2.4</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-base-200">
                    <Link 
                      to={
                        role === 'super_admin' ? '/superAdmindashboard/AllUsers' :
                        role === 'school_admin' ? '/schoolAdmindashboard' :
                        role === 'teacher' ? '/teacherdashboard' :
                        role === 'bursar' ? '/bursar-dashboard' :
                        role === 'student' ? '/studentdashboard' :
                        role === 'parent' ? '/parentdashboard' : '/dashboard'
                      }
                      className="btn btn-primary w-full rounded-xl text-xs font-bold shadow-md gap-2"
                    >
                      Open Your Full Dashboard <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Default Live Preview Card when Logged Out */
                <div className="bg-base-100 shadow-2xl rounded-3xl p-6 sm:p-8 border border-base-300 relative group hover:border-primary/50 transition-all duration-300">
                  <div className="absolute -top-3 -right-3 bg-primary text-primary-content text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md">
                    Live Preview
                  </div>

                  <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-base-200">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <GraduationCap className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-base-content">ElimuCloud Dashboard</h3>
                      <p className="text-xs text-base-content/60 font-medium">Multi-Tenant Operational Suite</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-base-200/50 flex items-center justify-between border border-base-300/60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-success/20 text-success flex items-center justify-center font-bold text-xs">✓</div>
                        <div>
                          <p className="text-xs font-bold">Fee Collections Synced</p>
                          <p className="text-[10px] text-base-content/60">Automated MPesa &amp; Bank Integration</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-success">+14.2%</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-base-200/50 flex items-center justify-between border border-base-300/60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">👥</div>
                        <div>
                          <p className="text-xs font-bold">Active Student Portals</p>
                          <p className="text-[10px] text-base-content/60">Real-time attendance &amp; grading</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-primary">1,420 Active</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-base-200/50 flex items-center justify-between border border-base-300/60">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-warning/25 text-warning flex items-center justify-center font-bold text-xs">🔒</div>
                        <div>
                          <p className="text-xs font-bold">Role-Based Security</p>
                          <p className="text-[10px] text-base-content/60">Admin, Teacher, Bursar &amp; Parent</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-warning">Secured</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-base-200 text-center">
                    <Link to="/login" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                      Sign in to your portal <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Core Features Grid Section */}
      <section className="py-20 bg-base-200/40 border-y border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              Robust Modules
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Everything Your Institution Needs
            </h2>
            <p className="text-sm sm:text-base text-base-content/70">
              Built specifically for modern educational demands, replacing fragmented spreadsheets with unified cloud intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-base-100 p-8 rounded-3xl shadow-xl border border-base-300 flex flex-col justify-between hover:shadow-2xl transition-all group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:bg-primary group-hover:text-primary-content transition-colors">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold">Role-Based Access Control</h3>
                <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                  Tailored dashboards for Super Admins, School Admins, Teachers, Bursars, Students, and Parents with strict cryptographic permission guards.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-base-200">
                <Link to="/features" className="text-xs font-bold text-primary inline-flex items-center gap-1 hover:underline">
                  Learn about permissions <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-base-100 p-8 rounded-3xl shadow-xl border border-base-300 flex flex-col justify-between hover:shadow-2xl transition-all group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:bg-primary group-hover:text-primary-content transition-colors">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold">Automated Fee Collections</h3>
                <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                  Streamline financial workflows with instant transaction reconciliation, electronic receipts, and automated arrears reminders.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-base-200">
                <Link to="/features" className="text-xs font-bold text-primary inline-flex items-center gap-1 hover:underline">
                  View billing tools <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-base-100 p-8 rounded-3xl shadow-xl border border-base-300 flex flex-col justify-between hover:shadow-2xl transition-all group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold group-hover:bg-primary group-hover:text-primary-content transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-extrabold">Student &amp; Staff Records</h3>
                <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed">
                  Maintain comprehensive digital profiles, admission documentation, attendance logs, and academic transcripts in one searchable repository.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-base-200">
                <Link to="/features" className="text-xs font-bold text-primary inline-flex items-center gap-1 hover:underline">
                  Explore student records <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
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
                <Zap className="w-3.5 h-3.5" /> Ready to transform your school?
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Get Started with ElimuCloud Today.
              </h2>
              <p className="text-sm sm:text-base text-primary-content/80 leading-relaxed">
                Join forward-thinking academic institutions upgrading their administrative backbone to secure cloud infrastructure.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-4 shrink-0">
              <Link 
                to="/register" 
                className="btn bg-base-100 text-primary hover:bg-base-200 btn-lg rounded-2xl font-bold px-8 shadow-xl"
              >
                Create Free Account
              </Link>
              <Link 
                to="/contact" 
                className="btn btn-outline text-primary-content border-white/40 hover:bg-white/10 btn-lg rounded-2xl font-bold px-8"
              >
                Contact Sales
              </Link>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;