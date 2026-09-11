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

const navItems = [
  { name: "Manage Users", path: "AllUsers", icon: <User className="text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage School Admins", path: "schoolAdmins", icon: <FaChalkboardTeacher className="text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage Parents", path: "AllParents", icon: <FaJetFighter className="text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage Classes", path: "AllClasses", icon: <School2 className="text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage ClassTeachers", path: "AllClassesTeachers", icon: <FaPumpMedical className="text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage Years", path: "AllYears", icon: <FaYammer className="text-current transition-transform duration-300 group-hover:scale-110" /> }, 
  { name: "Manage Terms", path: "AllTerms", icon: <Calendar1Icon className="text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage Students", path: "AllStudents", icon: <GraduationCap className="text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage Subjects", path: "AllSubjects", icon: <Book className="text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage StudentSubjects", path: "AllStudentSubjects", icon: <Book className="text-current transition-transform duration-300 group-hover:scale-110" /> },
  { name: "Manage Exams", path: "AllExams", icon: <TestTube className="text-current transition-transform duration-300 group-hover:scale-110" /> },  
  { name: "Manage Grades", path: "AllGrades", icon: <TestTube className="text-current transition-transform duration-300 group-hover:scale-110" /> }, 
  { name: "Logout", path: "logout", icon: <LogOut className="text-rose-500 transition-transform duration-300 group-hover:scale-110" /> },
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
    <div className="flex flex-col h-full w-full bg-base-200/95 backdrop-blur-md pt-0 px-3 pb-0 overflow-hidden">
      <div
        className={`
          flex flex-col
          h-full
          w-full
          bg-base-200 text-base-content
          p-2.5 rounded-2xl shadow-inner border border-base-300/60
          overflow-y-auto
          custom-scrollbar
        `}
      >
        {/* Header / Brand Badge */}
        <div className={`mb-3 pb-2.5 border-b border-base-300/50 flex items-center ${isCollapsed ? "justify-center" : "justify-center px-1"} shrink-0 overflow-hidden`}>
          {isCollapsed ? (
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md font-bold text-base"
              style={{ backgroundColor: primaryColor }}
              title="Admin Panel"
            >
              👑
            </div>
          ) : (
            <div className="w-full text-center space-y-1">
              <h4 className="flex items-center justify-center text-sm md:text-base font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r drop-shadow-sm whitespace-nowrap" style={{ backgroundImage: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
                <span className="mr-1.5 text-xs animate-pulse">🛠️</span>
                Admin Portal
                <span className="ml-1.5 text-xs">👑</span>
              </h4>
              <p className="text-[10px] uppercase font-bold tracking-widest text-base-content/50 truncate">
                {school?.name || 'Management Hub'}
              </p>
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
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-200 w-full text-left font-medium text-xs sm:text-sm ${
                  isCollapsed ? "justify-center px-0 py-3" : ""
                }`}
                aria-label="Logout"
                title={isCollapsed ? item.name : undefined}
              >
                <span className="shrink-0 text-base">{item.icon}</span>
                {!isCollapsed && <span className="font-chewy tracking-wide truncate">{item.name}</span>}
              </button>
            ) : (
              <NavLink
                key={index}
                to={item.path}
                end
                onClick={onNavItemClick}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
                    isCollapsed ? "justify-center px-0 py-3" : ""
                  } ${
                    isActive 
                      ? "shadow-sm font-bold text-white translate-x-1" 
                      : "hover:bg-base-300/80 text-base-content/80 hover:text-base-content"
                  }`
                }
                style={({ isActive }) => 
                  isActive 
                    ? { backgroundColor: primaryColor, boxShadow: `0 3px 10px ${primaryColor}40` } 
                    : {}
                }
                aria-label={`Go to ${item.name}`}
                title={isCollapsed ? item.name : undefined}
              >
                <span className="shrink-0 text-base">{item.icon}</span>
                {!isCollapsed && <span className="font-chewy tracking-wide truncate">{item.name}</span>}
              </NavLink>
            )
          )}
        </nav>
      </div>
    </div>
  );
};