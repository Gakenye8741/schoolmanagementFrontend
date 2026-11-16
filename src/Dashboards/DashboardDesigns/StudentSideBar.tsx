import { NavLink } from "react-router-dom";
import {
  LogOut,
  BarChart3,
  UserCircle2,
  BookOpen,
  CalendarClock,
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  Wallet,
  CalendarDays,
  BellDot,
  type LucideIcon,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearCredentials } from "../../features/Auth/AuthSlice";
import type { RootState } from "../../App/store";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";

/* ═══════════════════════════════════════════════════════════════
   NAV STRUCTURE — grouped, matching each page's own icon
   ═══════════════════════════════════════════════════════════════ */
type NavItem = { name: string; path: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { name: "Analytics", path: "analytics", icon: BarChart3 },
      { name: "My Profile", path: "profile", icon: UserCircle2 },
    ],
  },
  {
    label: "Academics",
    items: [
      { name: "My Subjects", path: "subjects", icon: BookOpen },
      { name: "Timetable", path: "timetable", icon: CalendarClock },
      { name: "Homework", path: "homework", icon: BookOpenCheck },
      { name: "Attendance", path: "attendance", icon: CalendarCheck },
      { name: "Exams & Results", path: "exams", icon: ClipboardCheck },
      { name: "Report Cards", path: "reportcards", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [{ name: "My Fees", path: "fees", icon: Wallet }],
  },
  {
    label: "School Life",
    items: [
      { name: "Events", path: "events", icon: CalendarDays },
      { name: "Notifications", path: "notifications", icon: BellDot },
    ],
  },
];

export const StudentSideNav = ({
  onNavItemClick,
  isCollapsed = false,
}: {
  onNavItemClick?: () => void;
  isCollapsed?: boolean;
}) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const schoolId = user?.schoolId || user?.user?.schoolId;

  const { data: school } = useGetSchoolByIdQuery(schoolId, {
    skip: !isAuthenticated || !schoolId,
  });
  const color = school?.primaryColor || "#6366f1";

  const itemBase = isCollapsed
    ? "justify-center h-11 w-11 mx-auto"
    : "gap-3 px-3 py-2.5";

  return (
    <nav className="flex flex-col h-full p-3 select-none">
      {/* ── Nav groups ── */}
      <div className={`flex-1 overflow-y-auto ${isCollapsed ? "space-y-2" : "space-y-5"}`}>
        {GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {/* Section header (expanded only) */}
            {!isCollapsed && (
              <p className="text-[10px] font-black uppercase tracking-[0.15em] opacity-45 px-3 pb-1">
                {group.label}
              </p>
            )}

            {group.items.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end
                onClick={onNavItemClick}
                title={isCollapsed ? name : undefined}
                className={({ isActive }) =>
                  `relative flex items-center rounded-xl text-[13px] font-semibold transition-all duration-150 ${itemBase} ${
                    isActive
                      ? "text-white shadow-md"
                      : "text-base-content/70 hover:bg-base-200 hover:text-base-content"
                  }`
                }
                style={({ isActive }) =>
                  isActive ? { backgroundColor: color } : undefined
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{name}</span>
                    )}
                    {isActive && !isCollapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                    )}
                    {isActive && isCollapsed && (
                      <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-5 rounded-l-full bg-white/90" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* ── Logout ── */}
      <div className="pt-3 mt-3 border-t border-base-300">
        <button
          onClick={() => {
            dispatch(clearCredentials());
            onNavItemClick?.();
          }}
          title={isCollapsed ? "Logout" : undefined}
          className={`flex items-center rounded-xl text-[13px] font-semibold transition-all duration-150 text-error hover:bg-error/10 w-full cursor-pointer ${itemBase}`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && <span className="truncate flex-1 text-left">Logout</span>}
        </button>
      </div>
    </nav>
  );
};