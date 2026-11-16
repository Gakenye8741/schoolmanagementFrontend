import { NavLink } from "react-router-dom";
import {
  LogOut,
  School2,
  GraduationCap,
  Users,
  UserCog,
  ShieldAlert,
  BookOpen,
  CalendarRange,
  ClipboardCheck,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CalendarCheck,
  Wallet,
  FileText,
  CardSim,
  BellDot,
  type LucideIcon,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearCredentials } from "../../features/Auth/AuthSlice";
import type { RootState } from "../../App/store";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";

/* ═══════════════════════════════════════════════════════════════
   NAV CONFIG — paths match the school admin routes
   ═══════════════════════════════════════════════════════════════ */

type NavItem = { name: string; path: string; icon: LucideIcon };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      { name: "School Details", path: "schoolDetails", icon: School2 },
      { name: "Academics", path: "academic", icon: GraduationCap },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Students", path: "AllStudents", icon: Users },
      { name: "Users", path: "userManagers", icon: UserCog },
      { name: "Discipline", path: "discipine", icon: ShieldAlert },
    ],
  },
  {
    label: "Learning",
    items: [
      { name: "Curriculum", path: "curriculum", icon: BookOpen },
      { name: "Terms", path: "AllTerms", icon: CalendarRange },
      { name: "Timetable", path: "timetable", icon: CalendarClock },
    ],
  },
  {
    label: "Assessment",
    items: [
      { name: "Exams", path: "exams", icon: ClipboardCheck },
      { name: "Grade Scale", path: "gradeScale", icon: BarChart3 },
      { name: "Report Cards", path: "reportcards", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Attendance", path: "attendance", icon: CalendarCheck },
      { name: "Events", path: "events", icon: CalendarDays },
      { name: "Fees", path: "fees", icon: CardSim },
      { name: "Expenses", path: "expenses", icon: Wallet },
      { name: "Notifications", path: "notifications", icon: BellDot },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export const SchoolAdminSideNav = ({
  onNavItemClick,
  isCollapsed = false,
}: {
  onNavItemClick?: () => void;
  isCollapsed?: boolean;
}) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, role } = useSelector(
    (state: RootState) => state.auth
  );
  const schoolId = user?.schoolId || user?.user?.schoolId;

  const { data: school } = useGetSchoolByIdQuery(schoolId, {
    skip: !isAuthenticated || !schoolId || role === "super_admin",
  });

  const primaryColor = school?.primaryColor || "#6366f1";
  const schoolName = school?.name || "Management Hub";
  const initial = schoolName.trim().charAt(0).toUpperCase() || "S";

  const handleLogout = () => {
    dispatch(clearCredentials());
    onNavItemClick?.();
  };

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end
        onClick={onNavItemClick}
        title={isCollapsed ? item.name : undefined}
        aria-label={`Go to ${item.name}`}
        className={({ isActive }) =>
          `group flex items-center rounded-xl text-[13px] font-semibold transition-all duration-200 ${
            isCollapsed ? "justify-center h-11 w-11 mx-auto" : "gap-3 px-3 py-2.5"
          } ${
            isActive
              ? "text-white shadow-md"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200"
          }`
        }
        style={({ isActive }) =>
          isActive
            ? { backgroundColor: primaryColor, boxShadow: `0 6px 16px ${primaryColor}45` }
            : {}
        }
      >
        <Icon className="w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110" />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </NavLink>
    );
  };

  return (
    <aside className="flex flex-col h-full w-full bg-base-100 border-r border-base-300/60 select-none">
      {/* Brand */}
      <div
        className={`shrink-0 flex items-center gap-3 border-b border-base-300/60 ${
          isCollapsed ? "justify-center py-5" : "px-5 py-5"
        }`}
      >
        <div
          className="w-10 h-10 rounded-2xl grid place-items-center text-white font-black text-base shadow-md shrink-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}bb)`,
            boxShadow: `0 6px 16px ${primaryColor}45`,
          }}
          title={isCollapsed ? schoolName : undefined}
        >
          {initial}
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-black tracking-tight truncate">{schoolName}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-45">Admin Portal</p>
          </div>
        )}
      </div>

      {/* Links */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="space-y-1">
            {isCollapsed ? (
              <div className="h-px mx-3 bg-base-300/60 first:hidden" />
            ) : (
              <p className="px-3 pb-1 text-[10px] font-black uppercase tracking-widest text-base-content/40">
                {section.label}
              </p>
            )}
            <div className="space-y-1">{section.items.map(renderItem)}</div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="shrink-0 p-3 border-t border-base-300/60">
        <button
          onClick={handleLogout}
          aria-label="Logout"
          title={isCollapsed ? "Logout" : undefined}
          className={`group flex items-center rounded-xl text-[13px] font-semibold text-error hover:bg-error/10 transition-all duration-200 ${
            isCollapsed ? "justify-center h-11 w-11 mx-auto" : "gap-3 px-3 py-2.5 w-full"
          }`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};