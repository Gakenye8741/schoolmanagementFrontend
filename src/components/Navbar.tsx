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
  // Initialize theme from localStorage or default to "garden"
  const [theme, setTheme] = useState<"garden" | "dark">(() => {
    return (localStorage.getItem("theme") as "garden" | "dark") || "garden";
  });

  // Track scroll position for dynamic glassmorphism shadow/blur
  const [isScrolled, setIsScrolled] = useState(false);
  
  const dispatch = useDispatch();
  const location = useLocation();

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const role = useSelector((state: RootState) => state.auth.role);
  const username = useSelector((state: RootState) => state.auth.user?.username);

  const isActive = (path: string) => (location.pathname === path ? "text-primary font-bold bg-primary/10" : "");

  const handleLogout = () => {
    dispatch(clearCredentials());
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Scroll listener for enhanced navbar styling on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "garden" ? "dark" : "garden"));
  };

  return (
    <nav className={`navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 lg:px-12 py-3 ${
      isScrolled 
        ? "bg-base-100/90 backdrop-blur-md shadow-lg border-b border-base-300" 
        : "bg-base-100/50 backdrop-blur-sm border-b border-transparent"
    }`}>
      {/* Navbar Start */}
      <div className="navbar-start">
        {/* Mobile menu dropdown */}
        <div className="dropdown lg:hidden">
          <label tabIndex={0} className="btn btn-ghost btn-circle">
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
            className="menu menu-sm dropdown-content mt-4 z-[1] p-3 shadow-xl bg-base-100 rounded-2xl w-60 border border-base-300 space-y-1.5"
          >
            <li>
              <Link to="/" className={`py-3 rounded-xl font-medium ${isActive("/")}`}>
                <HomeIcon className="w-4 h-4" /> Home
              </Link>
            </li>
            <li>
              <Link to="/features" className={`py-3 rounded-xl font-medium ${isActive("/features")}`}>
                <Layers className="w-4 h-4" /> Features
              </Link>
            </li>
            <li>
              <Link to="/pricing" className={`py-3 rounded-xl font-medium ${isActive("/pricing")}`}>
                <CreditCard className="w-4 h-4" /> Pricing
              </Link>
            </li>
            <li>
              <Link to="/about" className={`py-3 rounded-xl font-medium ${isActive("/about")}`}>
                <Info className="w-4 h-4" /> About Us
              </Link>
            </li>
            <li>
              <Link to="/contact" className={`py-3 rounded-xl font-medium ${isActive("/contact")}`}>
                <PhoneCall className="w-4 h-4" /> Contact
              </Link>
            </li>
            <li>
              <Link to="/legal" className={`py-3 rounded-xl font-medium ${isActive("/legal")}`}>
                <FileText className="w-4 h-4" /> Legal &amp; Trust
              </Link>
            </li>
            
            <div className="divider my-1"></div>

            {/* Mobile Theme Toggle Item */}
            <li>
              <button onClick={toggleTheme} className="py-3 rounded-xl font-medium flex items-center justify-between w-full">
                <span className="flex items-center gap-2">
                  {theme === "dark" ? <Moon className="w-4 h-4 text-warning" /> : <Sun className="w-4 h-4 text-warning" />}
                  Theme Mode
                </span>
                <span className="text-xs uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  {theme}
                </span>
              </button>
            </li>

            {!isAuthenticated && (
              <>
                <div className="divider my-1"></div>
                <li>
                  <Link to="/register" className={`py-3 rounded-xl font-medium ${isActive("/register")}`}>
                    <UserPlus className="w-4 h-4" /> Register
                  </Link>
                </li>
                <li>
                  <Link to="/login" className={`py-3 rounded-xl font-medium ${isActive("/login")}`}>
                    <LogIn className="w-4 h-4" /> Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Logo / Brand */}
        <Link to="/" className="btn btn-ghost flex items-center gap-2.5 px-2 hover:bg-transparent group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary to-primary/60 text-primary-content flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xl font-black tracking-tight leading-tight text-primary">
              ElimuCloud
            </span>
            <span className="text-[10px] uppercase tracking-widest text-base-content/60 font-bold">
              School management System
            </span>
          </div>
        </Link>
      </div>

      {/* Navbar Center (desktop menu) */}
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

      {/* Navbar End */}
      <div className="navbar-end gap-3">
        {/* Notification Center for Logged-In Users (Hidden on small screens) */}
        {isAuthenticated && (
          <div className="hidden lg:block dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle relative hover:bg-base-300/50 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            </label>
            <div tabIndex={0} className="dropdown-content bg-base-100 shadow-2xl border border-base-300 rounded-3xl w-72 p-4 mt-4 z-20">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-sm">Notifications</span>
                <span className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">New</span>
              </div>
              <div className="divider my-1"></div>
              <p className="text-xs text-base-content/70 py-3 text-center">No new notifications right now.</p>
            </div>
          </div>
        )}

        {/* Theme Toggle (Hidden on small screens since it's inside the mobile dropdown) */}
        <button 
          className="hidden lg:flex btn btn-ghost btn-circle hover:bg-base-300/50 transition-colors" 
          onClick={toggleTheme} 
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Moon className="w-5 h-5 text-warning transition-transform hover:rotate-12" />
          ) : (
            <Sun className="w-5 h-5 text-warning transition-transform hover:rotate-90" />
          )}
        </button>

        {/* Auth Section */}
        {isAuthenticated ? (
          <div className="dropdown dropdown-end group">
            <label tabIndex={0} className="flex items-center cursor-pointer">
              <div className="btn btn-outline btn-primary capitalize flex items-center gap-2.5 rounded-2xl px-4 shadow-sm hover:shadow-md transition-all">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                </span>
                <span className="truncate max-w-[120px] font-semibold">Hey, {username || 'User'}</span>
                <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
              </div>
            </label>
            <ul tabIndex={0} className="menu dropdown-content bg-base-100 shadow-2xl border border-base-300 rounded-3xl w-64 p-3 mt-4 z-20 space-y-1">
              <li className="menu-title px-4 py-2 text-xs uppercase font-bold tracking-wider opacity-60">
                Signed in as <span className="text-primary">{role?.replace('_', ' ')}</span>
              </li>
              <div className="divider my-1"></div>
              
              {/* Role-Based Dashboard Links */}
              <li>
                {role === 'super_admin' ? (
                  <Link to="/superAdmindashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <ShieldAlert className="h-4 w-4 text-primary" /> Super Admin Portal
                  </Link>
                ) : role === 'school_admin' ? (
                  <Link to="/Admindashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <Building className="h-4 w-4 text-primary" /> School Admin Dashboard
                  </Link>
                ) : role === 'teacher' ? (
                  <Link to="/teacher-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <UserCog className="h-4 w-4 text-primary" /> Teacher Dashboard
                  </Link>
                ) : role === 'bursar' ? (
                  <Link to="/bursar-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <UserCheck className="h-4 w-4 text-primary" /> Bursar Dashboard
                  </Link>
                ) : role === 'student' ? (
                  <Link to="/student-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <GraduationCap className="h-4 w-4 text-primary" /> Student Portal
                  </Link>
                ) : role === 'parent' ? (
                  <Link to="/parent-dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <Users className="h-4 w-4 text-primary" /> Parent Portal
                  </Link>
                ) : (
                  <Link to="/dashboard" className="font-semibold flex items-center gap-3 py-3 rounded-2xl hover:bg-primary/10 hover:text-primary transition-colors">
                    <LayoutDashboard className="h-4 w-4 text-primary" /> User Dashboard
                  </Link>
                )}
              </li>

              <div className="divider my-1"></div>
              <li>
                <button onClick={handleLogout} className="flex items-center gap-3 py-3 rounded-2xl font-semibold text-error hover:bg-error/10 transition-colors w-full text-left">
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="hidden lg:flex gap-2.5 items-center">
           
            <Link to="/login" className={`btn btn-primary btn-sm font-semibold rounded-xl px-5 shadow-sm hover:shadow transition-all ${isActive("/login")}`}>
              <LogIn className="mr-1.5 h-4 w-4" /> Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};