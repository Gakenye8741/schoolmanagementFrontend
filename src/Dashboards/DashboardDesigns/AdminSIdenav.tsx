import { NavLink } from "react-router-dom";
import {
  User,
  LogOut,
  School2,
  GraduationCap,
  Calendar1Icon,
  Book,
  TestTube,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearCredentials } from "../../features/Auth/AuthSlice";
import { FaChalkboardTeacher, FaPumpMedical } from "react-icons/fa";
import { FaJetFighter, FaYammer } from "react-icons/fa6";
import type { RootState } from "../../App/store";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";

/* ── Grouped nav sections ── */
const navGroups = [
  {
    title: "Institution",
    items: [
      
      { name: "Manage Schools",  path: "schools",     icon: User },
      { name: "School Admins",   path: "schoolAdmins", icon: FaChalkboardTeacher },
      { name: "Manage Users",    path: "users",       icon: FaJetFighter },
    ],
  },
  {
    title: "Academics",
    items: [
      { name: "Classes",         path: "AllClasses",        icon: School2 },
      { name: "Class Teachers",  path: "AllClassesTeachers", icon: FaPumpMedical },
      { name: "Years",           path: "AllYears",          icon: FaYammer },
      { name: "Terms",           path: "AllTerms",          icon: Calendar1Icon },
    ],
  },
  {
    title: "People",
    items: [
      { name: "Students",        path: "AllStudents",        icon: GraduationCap },
      { name: "Subjects",        path: "AllSubjects",        icon: Book },
      { name: "Student Subjects", path: "AllStudentSubjects", icon: Book },
    ],
  },
  {
    title: "Assessment",
    items: [
      { name: "Exams",           path: "AllExams",  icon: TestTube },
      { name: "Grades",          path: "AllGrades", icon: TestTube },
    ],
  },
];

export const AdminSideNav = ({ 
  onNavItemClick, 
  isCollapsed = false 
}: { 
  onNavItemClick?: () => void; 
  isCollapsed?: boolean; 
}) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, role } = useSelector((state: RootState) => state.auth);
  const schoolId = user?.schoolId || user?.user?.schoolId;

  const { data: school } = useGetSchoolByIdQuery(schoolId, {
    skip: !isAuthenticated || !schoolId || role === 'super_admin',
  });

  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  const handleLogout = () => {
    dispatch(clearCredentials());
    onNavItemClick?.();
  };

  return (
    // ✅ FIX: min-h-full (not h-full) + no overflow-hidden → grows with content and lets parent scroll
    <div className="flex flex-col min-h-full w-full">
      <nav className="flex flex-col flex-1 py-1">
        {navGroups.map((group, gIdx) => (
          <div key={group.title} className="mb-3 last:mb-0">
            {!isCollapsed && (
              <p className="text-[10px] uppercase tracking-widest font-black text-base-content/40 px-3 py-1.5 mb-1">
                {group.title}
              </p>
            )}

            {isCollapsed && gIdx > 0 && (
              <div className="h-px bg-base-300/60 mx-2 my-2" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    onClick={onNavItemClick}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                        isCollapsed ? "justify-center px-0 py-3" : ""
                      } ${
                        isActive 
                          ? "text-white shadow-md" 
                          : "text-base-content/70 hover:bg-base-300/70 hover:text-base-content"
                      }`
                    }
                    style={({ isActive }) => 
                      isActive 
                        ? { 
                            backgroundColor: primaryColor, 
                            boxShadow: `0 3px 12px ${primaryColor}40` 
                          } 
                        : {}
                    }
                    aria-label={item.name}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon 
                          className={`shrink-0 text-base transition-transform duration-300 ${
                            isCollapsed ? "" : "group-hover:scale-110"
                          }`}
                          size={18}
                        />
                        {!isCollapsed && (
                          <span className="truncate tracking-wide">{item.name}</span>
                        )}
                        {isActive && !isCollapsed && (
                          <span 
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-white/90 shadow-sm"
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        {/* ── Logout pinned to bottom ── */}
        <div className="mt-auto pt-3">
          {!isCollapsed && (
            <div className="h-px bg-base-300/60 mx-2 mb-2" />
          )}
          <button
            onClick={handleLogout}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200 w-full text-left font-medium text-sm ${
              isCollapsed ? "justify-center px-0 py-3" : ""
            }`}
            aria-label="Logout"
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut 
              size={18}
              className="shrink-0 text-rose-500 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-0.5" 
            />
            {!isCollapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </nav>
    </div>
  );
};