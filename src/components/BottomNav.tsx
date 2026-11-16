import {
  Home as HomeIcon,
  Layers,
  CreditCard,
  PhoneCall,
  LogIn,
  LayoutDashboard,
  ShieldAlert,
  Building,
  UserCog,
  UserCheck,
  GraduationCap,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import type { RootState } from "../App/store";

type Role = "super_admin" | "school_admin" | "teacher" | "bursar" | "student" | "parent" | undefined;
type NavItem = { to: string; label: string; Icon: LucideIcon };

const getDashboardPath = (role: Role) => {
  switch (role) {
    case "super_admin": return "/superAdmindashboard";
    case "school_admin": return "/schoolAdmindashboard";
    case "teacher": return "/teacher-dashboard";
    case "bursar": return "/bursar-dashboard";
    case "student": return "/student-dashboard";
    case "parent": return "/parent-dashboard";
    default: return "/dashboard";
  }
};

const getDashboardIcon = (role: Role): LucideIcon => {
  switch (role) {
    case "super_admin": return ShieldAlert;
    case "school_admin": return Building;
    case "teacher": return UserCog;
    case "bursar": return UserCheck;
    case "student": return GraduationCap;
    case "parent": return Users;
    default: return LayoutDashboard;
  }
};

const getItems = (isAuthenticated: boolean, role: Role): NavItem[] => {
  // ── Guest / public visitors ──
  if (!isAuthenticated) {
    return [
      { to: "/", label: "Home", Icon: HomeIcon },
      { to: "/features", label: "Features", Icon: Layers },
      { to: "/pricing", label: "Pricing", Icon: CreditCard },
      { to: "/contact", label: "Contact", Icon: PhoneCall },
      { to: "/Login", label: "Login", Icon: LogIn },
    ];
  }

  // ── Super Admin ──
  if (role === "super_admin") {
    return [
      { to: "/superAdmindashboard", label: "Home", Icon: LayoutDashboard },
      { to: "/superAdmindashboard/schools", label: "Schools", Icon: Building },
      { to: "/superAdmindashboard/schoolAdmins", label: "Admins", Icon: ShieldAlert },
      { to: "/superAdmindashboard/users", label: "Users", Icon: Users },
      { to: "/", label: "Site", Icon: HomeIcon },
    ];
  }

  // ── School Admin ──
  if (role === "school_admin") {
    return [
      { to: "/schoolAdmindashboard", label: "Home", Icon: LayoutDashboard },
      { to: "/schoolAdmindashboard/AllUsers", label: "Users", Icon: Users },
      { to: "/schoolAdmindashboard/AllTerms", label: "Terms", Icon: Layers },
      { to: "/schoolAdmindashboard/AllClasses", label: "Classes", Icon: GraduationCap },
      { to: "/schoolAdmindashboard/AllStudents", label: "Students", Icon: UserCheck },
    ];
  }

  // ── Other authenticated roles (teacher, bursar, student, parent) ──
  return [
    { to: "/", label: "Home", Icon: HomeIcon },
    { to: "/features", label: "Features", Icon: Layers },
    { to: "/pricing", label: "Pricing", Icon: CreditCard },
    { to: "/contact", label: "Contact", Icon: PhoneCall },
    { to: getDashboardPath(role), label: "Account", Icon: getDashboardIcon(role) },
  ];
};

export const BottomNav = () => {
  const location = useLocation();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
  const role = useSelector((s: RootState) => s.auth.role) as Role;

  const items = getItems(isAuthenticated, role);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-base-100/95 backdrop-blur-md border-t border-base-300 shadow-[0_-6px_24px_-8px_rgba(0,0,0,0.12)]">
      <ul className="grid grid-cols-5 max-w-md mx-auto px-1.5 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ to, label, Icon }) => {
          const active = isActive(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 px-0.5 rounded-xl transition-all duration-200 ${
                  active
                    ? "text-primary"
                    : "text-base-content/60 hover:text-base-content"
                }`}
              >
                <div
                  className={`relative p-1.5 rounded-xl transition-all ${
                    active ? "bg-primary/10" : ""
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "stroke-[2.5]" : "stroke-[2]"
                    }`}
                  />
                  {active && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold tracking-tight leading-none ${
                    active ? "text-primary" : ""
                  }`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};