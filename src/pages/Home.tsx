import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  BarChart3,
  Users,
  Zap,
  ChevronRight,
  Building,
  TrendingUp,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../App/store";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { usePageSeo } from "../hooks/usePageSeo";

const Home = () => {
  usePageSeo({
    title: "Academiq — Smart Multi-Tenant School Management Platform",
    description:
      "Academiq unifies student registration, fee collections, grade tracking, and role-based portals into a single, lightning-fast cloud workspace for modern educational institutions. Conceptualized and engineered by full-stack developer Brian Gakenye Ndiritu.",
    keywords:
      "school management system, school software Kenya, multi-tenant school ERP, student portal, fee collection software, Academiq, Academiq School Management System, Brian Gakenye Ndiritu",
  });

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const role = useSelector((state: RootState) => state.auth.role);

  const dashboardPath =
    role === "super_admin"
      ? "/superAdmindashboard/AllUsers"
      : role === "school_admin"
      ? "/schoolAdmindashboard"
      : role === "teacher"
      ? "/teacherdashboard"
      : role === "bursar"
      ? "/bursar-dashboard"
      : role === "student"
      ? "/studentdashboard"
      : role === "parent"
      ? "/parentdashboard"
      : "/dashboard";

  const steps = [
    {
      icon: Building,
      title: "Create your school account",
      text: "Sign up with your school name, logo, and contact details. Takes two minutes.",
      accent: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Users,
      title: "Add classes and subjects",
      text: "Set up grade levels, streams, and the subjects each class takes.",
      accent: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      icon: GraduationCap,
      title: "Register students and staff",
      text: "Add students, teachers, and parents one by one — or import from Excel if you already have a list.",
      accent: "text-success",
      bg: "bg-success/10",
    },
    {
      icon: BarChart3,
      title: "Start managing",
      text: "Collect fees, take attendance, enter marks, print report cards. All from one dashboard.",
      accent: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  const roles = [
    {
      icon: ShieldCheck,
      title: "Super Admin",
      text: "Manages every school on the platform.",
      accent: "text-primary",
      bg: "bg-primary/10",
      border: "hover:border-primary/40",
    },
    {
      icon: Building,
      title: "School Admin",
      text: "Runs one school from start to finish.",
      accent: "text-secondary",
      bg: "bg-secondary/10",
      border: "hover:border-secondary/40",
    },
    {
      icon: Users,
      title: "Teacher",
      text: "Takes attendance, enters marks, sets homework.",
      accent: "text-success",
      bg: "bg-success/10",
      border: "hover:border-success/40",
    },
    {
      icon: BarChart3,
      title: "Bursar",
      text: "Records payments and tracks fee balances.",
      accent: "text-warning",
      bg: "bg-warning/10",
      border: "hover:border-warning/40",
    },
    {
      icon: GraduationCap,
      title: "Student",
      text: "Checks timetable, results, and homework.",
      accent: "text-info",
      bg: "bg-info/10",
      border: "hover:border-info/40",
    },
    {
      icon: TrendingUp,
      title: "Parent",
      text: "Sees fee balance, report cards, and school updates.",
      accent: "text-accent",
      bg: "bg-accent/10",
      border: "hover:border-accent/40",
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 text-base-content flex flex-col font-sans selection:bg-primary selection:text-primary-content overflow-x-hidden">
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
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(18px, -18px) scale(1.06); }
        }
        .anim-fade-up    { animation: fadeInUp 0.85s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .anim-fade-in    { animation: fadeIn 0.9s ease-out both; }
        .anim-scale-in   { animation: scaleIn 0.75s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .anim-float      { animation: floatY 4s ease-in-out infinite; }
        .anim-orb-a      { animation: floatOrb 12s ease-in-out infinite; }
        .anim-orb-b      { animation: floatOrb 15s ease-in-out infinite reverse; }
        .anim-orb-c      { animation: floatOrb 18s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .anim-fade-up, .anim-fade-in, .anim-scale-in,
          .anim-float, .anim-orb-a, .anim-orb-b, .anim-orb-c {
            animation: none !important;
          }
        }
      `}</style>

      <Navbar />

      {/* ============================================================
          HERO — realistic spacing
          ============================================================ */}
      <section className="relative pt-24 pb-14 sm:pt-26 sm:pb-16 lg:pt-28 lg:pb-20 overflow-hidden bg-gradient-to-b from-base-200/60 via-base-100 to-base-100">
        <div className="anim-orb-a absolute top-0 left-1/4 w-[520px] h-[520px] bg-primary/15 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/3" />
        <div className="anim-orb-b absolute top-20 right-0 w-[460px] h-[460px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none translate-x-1/4" />
        <div className="anim-orb-c absolute bottom-0 left-1/2 w-[360px] h-[360px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* ── Left column ── */}
            <div className="lg:col-span-7 space-y-6">
              <h1
                className="anim-fade-up text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-base-content"
                style={{ animationDelay: "0.05s" }}
              >
                Run your school{" "}
                <span className="relative whitespace-nowrap">
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    without the paperwork
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 400 20"
                    className="absolute left-0 -bottom-2 w-full h-3 text-primary/40"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 15 Q 200 2 398 15"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>

              <p
                className="anim-fade-up text-base sm:text-lg text-base-content/70 leading-relaxed max-w-xl"
                style={{ animationDelay: "0.18s" }}
              >
                Academiq brings student records, fee payments, marks, and parent
                updates into one simple system. No more spreadsheets. No more
                paper files.
              </p>

              <div
                className="anim-fade-up flex flex-wrap items-center gap-3 pt-1"
                style={{ animationDelay: "0.32s" }}
              >
                {isAuthenticated ? (
                  <Link
                    to={dashboardPath}
                    className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-bold text-primary-content shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="group inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-bold text-primary-content shadow-lg hover:-translate-y-0.5 hover:shadow-xl transition-all"
                    >
                      Login to Portal
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link
                      to="/register"
                      className="inline-flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-6 py-3 text-sm font-bold text-base-content hover:bg-base-200 hover:border-primary/40 hover:-translate-y-0.5 transition-all"
                    >
                      Create Account
                    </Link>
                  </>
                )}
              </div>

              {/* Stats — school-focused */}
              <div
                className="anim-fade-up grid grid-cols-3 gap-3 pt-6 border-t border-base-300 max-w-md"
                style={{ animationDelay: "0.46s" }}
              >
                {[
                  { value: "500+", label: "Schools" },
                  { value: "50K+", label: "Students" },
                  { value: "6", label: "Role Portals" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="group transition-transform duration-300 hover:-translate-y-1"
                  >
                    <p className="text-2xl font-black text-primary tracking-tight transition-colors duration-300 group-hover:text-secondary">
                      {s.value}
                    </p>
                    <p className="text-[11px] text-base-content/60 font-semibold uppercase tracking-wider mt-0.5">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right column — hero card ── */}
            <div
              className="lg:col-span-5 anim-scale-in"
              style={{ animationDelay: "0.28s" }}
            >
              {isAuthenticated ? (
                /* ═════════ AUTHENTICATED CARD ═════════ */
                <div className="relative overflow-hidden rounded-3xl bg-base-100 border border-base-300 shadow-2xl transition-all duration-300 hover:shadow-[0_25px_60px_-15px_rgba(37,99,235,0.35)]">
                  {/* Small banner image behind the header */}
                  <div className="relative h-20 sm:h-24 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80"
                      alt="Campus"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-base-100" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

                    <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-base-100/95 backdrop-blur-md border border-success/30 px-2.5 py-1 shadow-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
                      </span>
                      <span className="text-[9px] font-extrabold uppercase text-success tracking-wider">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Header info */}
                  <div className="px-5 sm:px-6 -mt-8 relative">
                    <div className="flex items-end gap-3 mb-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg border-2 border-base-100 flex-shrink-0">
                        <img
                          src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=200&q=80"
                          alt="School"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 pb-0.5">
                        <h3 className="font-extrabold text-sm sm:text-base text-base-content truncate leading-tight">
                          {user?.schoolName ||
                            user?.school?.name ||
                            "Academiq Institution"}
                        </h3>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-wider mt-0.5">
                          {role?.replace("_", " ")} Portal
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className="px-5 sm:px-6 pb-5 space-y-2.5">
                    <div className="flex items-center justify-between rounded-2xl bg-base-200/60 border border-base-300/60 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-base-content">
                            Logged In User
                          </p>
                          <p className="text-[11px] text-base-content/70 truncate">
                            {user?.username || user?.email || "Member"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-primary/15 text-primary text-[10px] font-extrabold uppercase px-2 py-0.5 flex-shrink-0">
                        Online
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-base-200/60 border border-base-300/60 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-success/15 text-success flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-base-content">
                            Account Status
                          </p>
                          <p className="text-[11px] text-base-content/70 truncate">
                            Verified · Secure Cloud
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-success flex-shrink-0">
                        Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-base-200/60 border border-base-300/60 p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-warning/15 text-warning flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-base-content">
                            Environment
                          </p>
                          <p className="text-[11px] text-base-content/70 truncate">
                            Production Cluster
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-warning flex-shrink-0">
                        v2.4
                      </span>
                    </div>
                  </div>

                  <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-base-300">
                    <Link
                      to={dashboardPath}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-4 py-2.5 text-xs font-bold text-primary-content shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
                    >
                      Open Your Full Dashboard
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* ═════════ GUEST / LIVE PREVIEW CARD ═════════ */
                <div className="relative overflow-hidden rounded-3xl bg-base-100 border border-base-300 shadow-2xl transition-all duration-300 hover:border-primary/40 hover:shadow-[0_25px_60px_-15px_rgba(37,99,235,0.28)] hover:-translate-y-1">
                  {/* Hero image with overlay text */}
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                      alt="Students collaborating in a classroom"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-warning via-accent to-secondary" />

                    <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-base-100/95 backdrop-blur-md px-3 py-1 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase text-base-content tracking-wider">
                        Live Preview
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-5 right-5 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <GraduationCap className="w-4 h-4" />
                        <p className="text-[10px] uppercase tracking-widest font-bold opacity-90">
                          Academiq Dashboard
                        </p>
                      </div>
                      <h3 className="text-lg font-black leading-tight">
                        One place for your whole school
                      </h3>
                    </div>
                  </div>

                  {/* Trust row — avatars */}
                  <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-base-300">
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {[12, 32, 5, 45].map((id) => (
                          <img
                            key={id}
                            src={`https://i.pravatar.cc/60?img=${id}`}
                            alt=""
                            className="w-8 h-8 rounded-full border-2 border-base-100 object-cover shadow-sm"
                            loading="lazy"
                          />
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-base-100 bg-primary text-primary-content flex items-center justify-center text-[10px] font-extrabold shadow-sm">
                          +2K
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-0.5 text-warning">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-[10px] font-semibold text-base-content/70 mt-0.5">
                        Trusted by 500+ schools
                      </p>
                    </div>
                  </div>

                  {/* Feature rows */}
                  <div className="px-5 pt-3 pb-4 space-y-2.5">
                    <div className="flex items-center justify-between rounded-xl bg-base-200/60 border border-base-300/60 p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-success/15 text-success flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-base-content">
                            Fee payments tracked
                          </p>
                          <p className="text-[10px] text-base-content/60 truncate">
                            M-Pesa &amp; bank instantly
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-success flex-shrink-0">
                        +14.2%
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-base-200/60 border border-base-300/60 p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-base-content">
                            Students online
                          </p>
                          <p className="text-[10px] text-base-content/60 truncate">
                            Attendance &amp; marks in real time
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-primary flex-shrink-0">
                        1,420
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-base-200/60 border border-base-300/60 p-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-warning/15 text-warning flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-base-content">
                            Safe for every role
                          </p>
                          <p className="text-[10px] text-base-content/60 truncate">
                            Admin · Teacher · Bursar · Parent
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-warning flex-shrink-0">
                        Secured
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5 pt-2 border-t border-base-300">
                    <Link
                      to="/login"
                      className="group inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-base-200/60 hover:bg-primary hover:text-primary-content px-4 py-2.5 text-xs font-bold text-primary transition-all"
                    >
                      Sign in to your portal
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
          ============================================================ */}
      <section className="py-16 lg:py-20 bg-base-200/50 border-y border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="anim-fade-up inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                Getting started
              </span>
            </div>
            <h2
              className="anim-fade-up text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-base-content"
              style={{ animationDelay: "0.08s" }}
            >
              Ready in four simple steps
            </h2>
            <p
              className="anim-fade-up text-sm sm:text-base text-base-content/70 leading-relaxed"
              style={{ animationDelay: "0.16s" }}
            >
              From signup to a working school — in under an hour.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.title}
                  className="anim-fade-up group relative h-full flex flex-col rounded-3xl bg-base-100 border border-base-300 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 hover:border-primary/40 transition-all duration-300"
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  <div className="absolute top-4 right-4 text-5xl font-black text-base-300 select-none transition-transform duration-300 group-hover:scale-110 group-hover:text-primary/20">
                    {i + 1}
                  </div>

                  <div
                    className={`relative w-11 h-11 rounded-2xl ${s.bg} ${s.accent} flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-extrabold text-base-content mb-2 leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-sm text-base-content/70 leading-relaxed">
                    {s.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES
          ============================================================ */}
      <section className="py-16 lg:py-20 bg-base-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="anim-fade-up inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                Everything you need
              </span>
            </div>
            <h2
              className="anim-fade-up text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-base-content"
              style={{ animationDelay: "0.08s" }}
            >
              One system for your whole school
            </h2>
            <p
              className="anim-fade-up text-sm sm:text-base text-base-content/70 leading-relaxed"
              style={{ animationDelay: "0.16s" }}
            >
              Records, money, marks, and messages — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: "Each person sees only what they need",
                desc: "A Super Admin manages all schools. A School Admin runs one school. A Teacher handles one class. A Bursar deals with money. Students and parents see only their own records.",
                accent: "text-primary",
                bg: "bg-primary/10",
                hoverBg: "group-hover:bg-primary",
                hoverBorder: "hover:border-primary/40",
                linkColor: "text-primary",
                link: "/features",
                linkText: "Learn more about roles",
              },
              {
                icon: BarChart3,
                title: "Record fee payments in seconds",
                desc: "Accept M-Pesa, bank, cash, or cheque. The system records each payment and updates the balance instantly. Print receipts. See who has paid and who still owes — without opening a spreadsheet.",
                accent: "text-success",
                bg: "bg-success/10",
                hoverBg: "group-hover:bg-success",
                hoverBorder: "hover:border-success/40",
                linkColor: "text-success",
                link: "/features",
                linkText: "See fee tracking",
              },
              {
                icon: Users,
                title: "Every student record in one place",
                desc: "Store names, admission numbers, photos, guardians, medical notes, attendance, marks, and report cards. Find any record in seconds by searching a name or admission number.",
                accent: "text-warning",
                bg: "bg-warning/10",
                hoverBg: "group-hover:bg-warning",
                hoverBorder: "hover:border-warning/40",
                linkColor: "text-warning",
                link: "/features",
                linkText: "Explore student records",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`anim-fade-up group flex flex-col justify-between h-full rounded-3xl bg-base-100 border border-base-300 p-6 shadow-sm ${f.hoverBorder} hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300`}
                  style={{ animationDelay: `${0.1 + i * 0.12}s` }}
                >
                  <div className="space-y-3">
                    <div
                      className={`w-11 h-11 rounded-2xl ${f.bg} ${f.accent} flex items-center justify-center ${f.hoverBg} group-hover:text-primary-content transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-extrabold text-base-content leading-tight">
                      {f.title}
                    </h3>
                    <p className="text-sm text-base-content/70 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                  <div className="pt-5 mt-5 border-t border-base-300">
                    <Link
                      to={f.link}
                      className={`inline-flex items-center gap-1 text-xs font-bold ${f.linkColor} hover:gap-2 transition-all`}
                    >
                      {f.linkText}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          WHO IT'S FOR
          ============================================================ */}
      <section className="py-16 lg:py-20 bg-base-200/50 border-y border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="anim-fade-up inline-flex items-center gap-2 rounded-full bg-secondary/10 text-secondary px-3 py-1">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider">
                For every role
              </span>
            </div>
            <h2
              className="anim-fade-up text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-base-content"
              style={{ animationDelay: "0.08s" }}
            >
              Built for everyone in your school
            </h2>
            <p
              className="anim-fade-up text-sm sm:text-base text-base-content/70 leading-relaxed"
              style={{ animationDelay: "0.16s" }}
            >
              Six roles. One system. Each person gets a screen that makes sense
              for their job.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r, i) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.title}
                  className={`anim-fade-up group h-full flex flex-col rounded-2xl bg-base-100 border border-base-300 p-5 shadow-sm ${r.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
                  style={{ animationDelay: `${0.08 + i * 0.08}s` }}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl ${r.bg} ${r.accent} flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-extrabold text-base text-base-content">
                      {r.title}
                    </h3>
                  </div>
                  <p className="text-sm text-base-content/70 leading-relaxed">
                    {r.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          CTA BANNER
          ============================================================ */}
      <section className="py-16 lg:py-20 bg-base-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="anim-scale-in relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-secondary p-8 sm:p-10 lg:p-14 text-primary-content shadow-2xl">
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-content/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary-content/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
              <div className="space-y-3 max-w-2xl text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary-content/15 backdrop-blur-md border border-primary-content/25 px-3 py-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">
                    Ready to simplify your school?
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1]">
                  Get started with Academiq today.
                </h2>
                <p className="text-sm sm:text-base text-primary-content/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Join schools across Kenya that have moved from paper files to
                  a modern cloud system.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-base-100 text-primary px-6 py-3 text-sm font-bold shadow-xl hover:bg-base-200 hover:-translate-y-0.5 transition-all"
                >
                  Create Free Account
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-primary-content/30 bg-primary-content/10 backdrop-blur-md text-primary-content px-6 py-3 text-sm font-bold hover:bg-primary-content/20 hover:-translate-y-0.5 transition-all"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;