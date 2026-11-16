import {
  Home as HomeIcon,
  LogIn,
  Sun,
  Moon,
  ChevronDown,
  UserCheck,
  LogOut,
  UserPlus,
  GraduationCap,
  LayoutDashboard,
  ShieldAlert,
  Building,
  UserCog,
  Users,
  Bell,
  Layers,
  CreditCard,
  Info,
  PhoneCall,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import type { RootState } from "../App/store";
import { clearCredentials } from "../features/Auth/AuthSlice";

export const Navbar = () => {
  // Theme now uses the "light" | "dark" names registered in index.css
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  const [isScrolled, setIsScrolled] = useState(false);

  const dispatch = useDispatch();
  const location = useLocation();

  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const role = useSelector((s: RootState) => s.auth.role);
  const authUser = useSelector((s: RootState) => s.auth.user);

  // The user object can be flat or nested (user.user), so merge both levels.
  const u: any = { ...((authUser as any)?.user ?? {}), ...((authUser as any) ?? {}) };
  const fullName: string =
    `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() ||
    u.fullName ||
    u.name ||
    u.username ||
    (u.email ? String(u.email).split("@")[0] : "") ||
    "User";
  const firstName: string = u.firstName || fullName.split(" ")[0];
  const email: string | null = u.email ?? null;
  const initial = fullName.charAt(0).toUpperCase();

  const isActive = (path: string) =>
    location.pathname === path ? "text-primary font-bold bg-primary/10" : "";

  const handleLogout = () => dispatch(clearCredentials());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <nav
      className={`navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-3 sm:px-4 lg:px-12 py-2.5 sm:py-3 ${
        isScrolled
          ? "bg-base-100/90 backdrop-blur-md shadow-lg border-b border-base-300"
          : "bg-base-100/70 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      {/* ---------- Navbar Start ---------- */}
      <div className="navbar-start">
        {/* Mobile hamburger — extended menu (About, Legal, Register, etc.) */}
        <div className="dropdown lg:hidden">
          <label tabIndex={0} className="btn btn-ghost btn-circle btn-sm">
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-4 z-[1] p-3 shadow-2xl bg-base-100 rounded-2xl w-64 border border-base-300 space-y-1.5"
          >
            <li>
              <Link to="/" className={`py-3 rounded-xl font-medium ${isActive("/")}`}>
                <HomeIcon className="w-4 h-4 text-primary" /> Home
              </Link>
            </li>
            <li>
              <Link to="/features" className={`py-3 rounded-xl font-medium ${isActive("/features")}`}>
                <Layers className="w-4 h-4 text-primary" /> Features &amp; Modules
              </Link>
            </li>
            <li>
              <Link to="/pricing" className={`py-3 rounded-xl font-medium ${isActive("/pricing")}`}>
                <CreditCard className="w-4 h-4 text-primary" /> Pricing &amp; Plans
              </Link>
            </li>
            <li>
              <Link to="/about" className={`py-3 rounded-xl font-medium ${isActive("/about")}`}>
                <Info className="w-4 h-4 text-primary" /> About Academiq
              </Link>
            </li>
            <li>
              <Link to="/contact" className={`py-3 rounded-xl font-medium ${isActive("/contact")}`}>
                <PhoneCall className="w-4 h-4 text-primary" /> Contact Support
              </Link>
            </li>
            <li>
              <Link to="/legal" className={`py-3 rounded-xl font-medium ${isActive("/legal")}`}>
                <FileText className="w-4 h-4 text-primary" /> Legal &amp; Trust Center
              </Link>
            </li>

            <div className="divider my-1" />

            {/* Mobile theme toggle */}
            <li>
              <button
                onClick={toggleTheme}
                className="py-3 rounded-xl font-medium flex items-center justify-between w-full group"
              >
                <span className="flex items-center gap-2">
                  <div className="relative w-5 h-5 flex items-center justify-center bg-base-200/80 rounded-full p-0.5 border border-base-300">
                    <Sun
                      className={`absolute w-3.5 h-3.5 text-base-content transition-all duration-500 ease-in-out transform ${
                        theme === "dark"
                          ? "rotate-90 scale-0 opacity-0"
                          : "rotate-0 scale-100 opacity-100"
                      }`}
                    />
                    <Moon
                      className={`absolute w-3.5 h-3.5 text-primary transition-all duration-500 ease-in-out transform ${
                        theme === "dark"
                          ? "rotate-0 scale-100 opacity-100"
                          : "-rotate-90 scale-0 opacity-0"
                      }`}
                    />
                  </div>
                  Theme Mode
                </span>
                <span className="text-xs uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {theme}
                </span>
              </button>
            </li>

            {!isAuthenticated && (
              <>
                <div className="divider my-1" />
                <li>
                  <Link to="/register" className={`py-3 rounded-xl font-medium ${isActive("/register")}`}>
                    <UserPlus className="w-4 h-4 text-primary" /> Register Institution
                  </Link>
                </li>
                <li>
                  <Link to="/login" className={`py-3 rounded-xl font-medium ${isActive("/login")}`}>
                    <LogIn className="w-4 h-4 text-primary" /> Portal Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Brand */}
        <Link
          to="/"
          className="btn btn-ghost flex items-center gap-2 px-1 sm:px-2 hover:bg-transparent group"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-primary via-primary/80 to-secondary text-primary-content flex items-center justify-center shadow-lg shadow-primary/30 transition-transform group-hover:scale-105">
            <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg sm:text-xl font-black tracking-tight leading-tight text-primary">
              Academiq
            </span>
            <span className="hidden sm:block text-[10px] uppercase tracking-widest text-base-content/60 font-bold">
              School Management System
            </span>
          </div>
        </Link>
      </div>

      {/* ---------- Navbar Center ---------- */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          <li>
            <Link to="/" className={`rounded-xl px-4 py-2.5 font-medium transition-all ${isActive("/")}`}>
              <HomeIcon className="w-4 h-4" /> Home
            </Link>
          </li>
          <li>
            <Link to="/features" className={`rounded-xl px-4 py-2.5 font-medium transition-all ${isActive("/features")}`}>
              <Layers className="w-4 h-4" /> Features
            </Link>
          </li>
          <li>
            <Link to="/pricing" className={`rounded-xl px-4 py-2.5 font-medium transition-all ${isActive("/pricing")}`}>
              <CreditCard className="w-4 h-4" /> Pricing
            </Link>
          </li>
          <li>
            <Link to="/about" className={`rounded-xl px-4 py-2.5 font-medium transition-all ${isActive("/about")}`}>
              <Info className="w-4 h-4" /> About Us
            </Link>
          </li>
          <li>
            <Link to="/contact" className={`rounded-xl px-4 py-2.5 font-medium transition-all ${isActive("/contact")}`}>
              <PhoneCall className="w-4 h-4" /> Contact
            </Link>
          </li>
          <li>
            <Link to="/legal" className={`rounded-xl px-4 py-2.5 font-medium transition-all ${isActive("/legal")}`}>
              <FileText className="w-4 h-4" /> Legal
            </Link>
          </li>
        </ul>
      </div>

      {/* ---------- Navbar End ---------- */}
      <div className="navbar-end gap-1.5 sm:gap-3">
        {/* Notifications (desktop only) */}
        {isAuthenticated && (
          <div className="hidden lg:block dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle relative hover:bg-base-300/50 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full animate-pulse" />
            </label>
            <div tabIndex={0} className="dropdown-content bg-base-100 shadow-2xl border border-base-300 rounded-3xl w-80 p-4 mt-4 z-20">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">System Notifications</span>
                <span className="text-[10px] bg-secondary/15 text-secondary font-semibold px-2 py-0.5 rounded-full">
                  Live
                </span>
              </div>
              <div className="divider my-1" />
              <div className="space-y-2 py-1">
                <div className="p-2.5 rounded-xl bg-base-200/60 text-xs space-y-1">
                  <p className="font-semibold text-base-content">Academiq v2.4 Online</p>
                  <p className="text-base-content/70">
                    Multi-tenant cloud architecture operating at peak stability.
                  </p>
                </div>
              </div>
              <div className="divider my-1" />
              <p className="text-[11px] text-base-content/60 text-center">
                All institutional sub-systems nominal.
              </p>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          className="flex btn btn-ghost btn-circle btn-sm bg-base-200/80 hover:bg-base-300 border border-base-300 transition-all duration-300 group shadow-sm"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            <Sun
              className={`absolute w-4 h-4 text-base-content transition-all duration-500 ease-in-out transform ${
                theme === "dark"
                  ? "rotate-90 scale-0 opacity-0"
                  : "rotate-0 scale-100 opacity-100 group-hover:rotate-45"
              }`}
            />
            <Moon
              className={`absolute w-4 h-4 text-primary transition-all duration-500 ease-in-out transform ${
                theme === "dark"
                  ? "rotate-0 scale-100 opacity-100 group-hover:-rotate-12"
                  : "-rotate-90 scale-0 opacity-0"
              }`}
            />
          </div>
        </button>

        {/* Auth */}
        {isAuthenticated ? (
          <div className="dropdown dropdown-end group">
            <label tabIndex={0} className="flex items-center cursor-pointer">
              <div className="btn btn-outline btn-primary flex items-center gap-2 rounded-2xl px-2.5 sm:px-4 shadow-sm hover:shadow-md transition-all btn-sm">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-content grid place-items-center text-[10px] font-black shrink-0">
                  {initial}
                </span>
                <span className="hidden sm:inline truncate max-w-[140px] font-semibold normal-case">
                  Hey, {firstName}
                </span>
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </div>
            </label>
            <ul
              tabIndex={0}
              className="menu dropdown-content bg-base-100 shadow-2xl border border-base-300 rounded-3xl w-72 p-3 mt-4 z-20 space-y-1"
            >
              {/* Signed-in user card */}
              <li className="menu-title !p-0 mb-1">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-base-200/60 normal-case">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-content grid place-items-center font-black shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-base-content truncate">{fullName}</p>
                    {email && (
                      <p className="text-[11px] font-medium opacity-60 truncate normal-case">{email}</p>
                    )}
                    <p className="text-[10px] uppercase tracking-wider font-bold text-primary">
                      {role?.replace("_", " ")}
                    </p>
                  </div>
                </div>
              </li>

              <li>
                {role === "super_admin" ? (
                  <Link to="/superAdmin-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Super Admin Portal
                  </Link>
                ) : role === "school_admin" ? (
                  <Link to="/schoolAdmin-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <Building className="h-4 w-4 text-primary" /> School Admin Dashboard
                  </Link>
                ) : role === "teacher" ? (
                  <Link to="/teacher-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <UserCog className="h-4 w-4 text-primary" /> Teacher Dashboard
                  </Link>
                ) : role === "bursar" ? (
                  <Link to="/bursar-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <UserCheck className="h-4 w-4 text-primary" /> Bursar Dashboard
                  </Link>
                ) : role === "student" ? (
                  <Link to="/student-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <GraduationCap className="h-4 w-4 text-primary" /> Student Portal
                  </Link>
                ) : role === "parent" ? (
                  <Link to="/parent-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <Users className="h-4 w-4 text-primary" /> Parent Portal
                  </Link>
                ) : (
                  <Link to="/dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <LayoutDashboard className="h-4 w-4 text-primary" /> User Dashboard
                  </Link>
                )}
              </li>

              <div className="divider my-1" />
              <li>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 py-3 rounded-2xl font-semibold text-error hover:bg-error/10 transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <Link
            to="/login"
            className={`btn btn-primary btn-sm font-semibold rounded-xl px-2.5 sm:px-5 shadow-sm hover:shadow transition-all ${isActive("/login")}`}
          >
            <LogIn className="sm:mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Login</span>
          </Link>
        )}
      </div>
    </nav>
  );
};