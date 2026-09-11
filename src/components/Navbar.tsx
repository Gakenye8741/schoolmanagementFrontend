import {
  Home as HomeIcon,
  HelpCircle,
  BookOpen,
  Users,
  Phone,
  LogIn,
  Sun,
  Moon,
  ChevronDown,
  UserCheck,
  User,
  LogOut,
  UserPlus,
  GraduationCap,
  LayoutDashboard,
  ShieldAlert,
  Building,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import type { RootState } from "../App/store";
import { clearCredentials } from "../features/Auth/AuthSlice";

export const Navbar = () => {
  // Initialize theme from localStorage or default to "garden"
  const [theme, setTheme] = useState<"garden" | "dark">(() => {
    return (localStorage.getItem("theme") as "garden" | "dark") || "garden";
  });
  
  const dispatch = useDispatch();
  const location = useLocation();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const role = useSelector((state: RootState) => state.auth.role);
  const username = useSelector((state: RootState) => state.auth.user?.username);

  const isActive = (path: string) => (location.pathname === path ? "text-primary font-bold" : "");

  const handleLogout = () => {
    dispatch(clearCredentials());
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "garden" ? "dark" : "garden"));
  };

  return (
    <div className="navbar fixed top-0 left-0 right-0 z-50 bg-base-100/90 backdrop-blur text-base-content shadow-sm border-b border-base-300 transition-all px-4 lg:px-8">
      {/* Navbar Start */}
      <div className="navbar-start">
        {/* Dropdown (mobile menu) */}
        <div className="dropdown">
          <label tabIndex={0} className="btn btn-ghost lg:hidden">
            <svg
              className="w-6 h-6"
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
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 border border-base-300"
          >
            <li><Link to="/"><HomeIcon className="w-4 h-4" /> Home</Link></li>
            <li><Link to="/About"><HelpCircle className="w-4 h-4" /> About</Link></li>
            <li><Link to="/Admissions">Admissions</Link></li>
            <li><a><BookOpen className="w-4 h-4" /> Academics</a></li>
            <li><a><Users className="w-4 h-4" /> Faculty</a></li>
            <li><a><Phone className="w-4 h-4" /> Contact</a></li>
            {!isAuthenticated && (
              <>
                <div className="divider my-1"></div>
                <li><Link to="/register"><UserPlus className="w-4 h-4" /> Register</Link></li>
                <li><Link to="/login"><LogIn className="w-4 h-4" /> Login</Link></li>
              </>
            )}
          </ul>
        </div>

        {/* Logo / Title */}
        <Link to="/" className="btn btn-ghost flex items-center gap-2 px-2 hover:bg-transparent">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-extrabold tracking-tight leading-none text-primary">
              ElimuHub
            </span>
            <span className="text-[10px] uppercase tracking-widest text-base-content/60 font-semibold mt-0.5">
              School System
            </span>
          </div>
        </Link>
      </div>

      {/* Navbar Center (desktop menu) */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-1">
          <li><Link to="/" className={`rounded-lg ${isActive("/")}`}><HomeIcon className="w-4 h-4" /> Home</Link></li>
          <li><Link to="/About" className={`rounded-lg ${isActive("/About")}`}><HelpCircle className="w-4 h-4" /> About</Link></li>
          <li><Link to="/Admissions" className={`rounded-lg ${isActive("/Admissions")}`}>Admissions</Link></li>
          <li><a className="rounded-lg"><BookOpen className="w-4 h-4" /> Academics</a></li>
          <li><a className="rounded-lg"><Users className="w-4 h-4" /> Faculty</a></li>
          <li><a className="rounded-lg"><Phone className="w-4 h-4" /> Contact</a></li>
        </ul>
      </div>

      {/* Navbar End */}
      <div className="navbar-end gap-3">
        {/* Theme Toggle */}
        <button className="btn btn-ghost btn-circle" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === "dark" ? <Moon className="w-5 h-5 text-warning" /> : <Sun className="w-5 h-5 text-warning" />}
        </button>

        {/* Auth Section */}
        {isAuthenticated ? (
          <div className="dropdown dropdown-end group">
            <label tabIndex={0} className="flex items-center cursor-pointer">
              <div className="btn btn-outline btn-primary capitalize flex items-center gap-2 rounded-xl">
                <span className="truncate max-w-[120px]">Hey, {username || 'User'}</span>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
              </div>
            </label>
            <ul tabIndex={0} className="menu dropdown-content bg-base-100 shadow-xl border border-base-300 rounded-2xl w-64 p-2 mt-3 z-20">
              <li className="menu-title px-4 py-2 text-xs uppercase opacity-70">
                Signed in as <span className="font-bold">{role?.replace('_', ' ')}</span>
              </li>
              <div className="divider my-1"></div>
              
              {/* Role-Based Dashboard Links */}
              <li>
                {role === 'super_admin' ? (
                  <Link to="/superAdmindashboard" className="font-semibold flex items-center gap-2.5 py-2.5 rounded-xl">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Super Admin Portal
                  </Link>
                ) : role === 'school_admin' ? (
                  <Link to="/Admindashboard" className="font-semibold flex items-center gap-2.5 py-2.5 rounded-xl">
                    <Building className="h-4 w-4 text-primary" /> School Admin Dashboard
                  </Link>
                ) : role === 'teacher' ? (
                  <Link to="/teacher-dashboard" className="font-semibold flex items-center gap-2.5 py-2.5 rounded-xl">
                    <UserCog className="h-4 w-4 text-primary" /> Teacher Dashboard
                  </Link>
                ) : role === 'bursar' ? (
                  <Link to="/bursar-dashboard" className="font-semibold flex items-center gap-2.5 py-2.5 rounded-xl">
                    <UserCheck className="h-4 w-4 text-primary" /> Bursar Dashboard
                  </Link>
                ) : role === 'student' ? (
                  <Link to="/student-dashboard" className="font-semibold flex items-center gap-2.5 py-2.5 rounded-xl">
                    <GraduationCap className="h-4 w-4 text-primary" /> Student Portal
                  </Link>
                ) : role === 'parent' ? (
                  <Link to="/parent-dashboard" className="font-semibold flex items-center gap-2.5 py-2.5 rounded-xl">
                    <Users className="h-4 w-4 text-primary" /> Parent Portal
                  </Link>
                ) : (
                  <Link to="/dashboard" className="font-semibold flex items-center gap-2.5 py-2.5 rounded-xl">
                    <LayoutDashboard className="h-4 w-4 text-primary" /> User Dashboard
                  </Link>
                )}
              </li>

              <div className="divider my-1"></div>
              <li>
                <button onClick={handleLogout} className="flex items-center gap-2.5 py-2.5 rounded-xl text-error hover:bg-error/10">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="hidden lg:flex gap-2 items-center">
            <Link to="/register" className={`btn btn-ghost btn-sm font-semibold rounded-xl ${isActive("/register")}`}>
              <UserPlus className="mr-1.5 h-4 w-4" /> Register
            </Link>
            <Link to="/login" className={`btn btn-primary btn-sm font-semibold rounded-xl shadow-sm ${isActive("/login")}`}>
              <LogIn className="mr-1.5 h-4 w-4" /> Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};