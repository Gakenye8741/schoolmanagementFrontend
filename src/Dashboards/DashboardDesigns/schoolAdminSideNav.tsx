import { NavLink } from "react-router-dom";
import {
  LogOut,
  School2,
  GraduationCap,
  Calendar1Icon,
  Book,
  TestTube,
  Users,
  Layers,
  UserCheck,
  CalendarDays,
  FileSpreadsheet,
  Award,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { clearCredentials } from "../../features/Auth/AuthSlice";
import type { RootState } from "../../App/store";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";

const navItems = [
 
  { name: "Register Users", path: "AllUsers", icon: <Users className="w-4 h-4 text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage Terms", path: "AllTerms", icon: <School2 className="w-4 h-4 text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage Class ", path: "AllClasses", icon: <GraduationCap className="w-4 h-4 text-current transition-transform duration-300 group-hover:scale-110" /> },
    { name: "Manage Students", path: "AllStudents", icon: <Layers className="w-4 h-4 text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage users", path: "userManagers", icon: <Book className="w-4 h-4 text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Student Subjects", path: "AllStudentSubjects", icon: <FileSpreadsheet className="w-4 h-4 text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage Exams", path: "AllExams", icon: <TestTube className="w-4 h-4 text-current transition-transform duration-300 group-hover:scale-110" /> },  
  { name: "Manage Grades", path: "AllGrades", icon: <Award className="w-4 h-4 text-current transition-transform duration-300 group-hover:scale-110" /> }, 
  { name: "Logout", path: "logout", icon: <LogOut className="w-4 h-4 text-rose-500 transition-transform duration-300 group-hover:scale-110" /> },
];

export const SchoolAdminSideNav = ({ 
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
    <div className="flex flex-col h-full w-full bg-base-200/80 backdrop-blur-xl p-3 select-none overflow-hidden border-r border-base-300/60">
      <div
        className={`
          flex flex-col
          h-full
          w-full
          bg-base-100/70 text-base-content
          p-3 rounded-2xl shadow-sm border border-base-300/50
          overflow-y-auto
          custom-scrollbar
        `}
      >
        {/* Header / Brand Badge */}
        <div className={`mb-4 pb-3 border-b border-base-300/60 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-2"} shrink-0`}>
          {isCollapsed ? (
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md font-bold text-sm"
              style={{ backgroundColor: primaryColor }}
              title="Admin Portal"
            >
              ⚡
            </div>
          ) : (
            <div className="w-full space-y-1">
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0"
                  style={{ backgroundColor: primaryColor }}
                >
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wider uppercase text-base-content/90 truncate">
                    Admin Portal
                  </h4>
                  <p className="text-[10px] font-semibold opacity-50 truncate max-w-[150px]">
                    {school?.name || 'Management Hub'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Nav Links Container */}
        <nav className="flex flex-col space-y-1.5 flex-1">
          {navItems.map((item, index) =>
            item.name === "Logout" ? (
              <button
                key={index}
                onClick={handleLogout}
                className={`group flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200 w-full text-left font-semibold text-xs tracking-wide ${
                  isCollapsed ? "justify-center px-0 py-3.5" : ""
                }`}
                aria-label="Logout"
                title={isCollapsed ? item.name : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </button>
            ) : (
              <NavLink
                key={index}
                to={item.path}
                end
                onClick={onNavItemClick}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 font-semibold text-xs tracking-wide ${
                    isCollapsed ? "justify-center px-0 py-3.5" : ""
                  } ${
                    isActive 
                      ? "shadow-md text-white font-bold" 
                      : "hover:bg-base-200/80 text-base-content/75 hover:text-base-content"
                  }`
                }
                style={({ isActive }) => 
                  isActive 
                    ? { backgroundColor: primaryColor, boxShadow: `0 4px 12px ${primaryColor}40` } 
                    : {}
                }
                aria-label={`Go to ${item.name}`}
                title={isCollapsed ? item.name : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            )
          )}
        </nav>
      </div>
    </div>
  );
};