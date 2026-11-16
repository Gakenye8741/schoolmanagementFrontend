import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom"
import Home from "./pages/Home";
import Login from "./pages/Login & Register/Login";
import ProtectedRoutes from "./components/ProtectedRoutes";
import SchoolDashboard from "./pages/schoolDashboard";
import { useDocumentTitle } from "./components/useDocumentTitle";
import { SuperAdminDashBoard } from "./pages/Dashboards/superAdminDashboard";
import ManageSchools from "./Dashboards/superAdminDashboard/schoolManager";
import SchoolAdminManager from "./Dashboards/superAdminDashboard/manageSchoolAdmins";
import { SchoolAdminDashBoard } from "./pages/Dashboards/schoolAdminDAshboard";

// import RegisterSchoolMemberManager from "./Dashboards/schooladminDashboard/userRegistrations";
import TermManager from "./Dashboards/schooladminDashboard/academicTerm";
import Error from "./components/Error";

import { StudentManager } from "./Dashboards/schooladminDashboard/studentMAnager";
import { UserManager } from "./Dashboards/schooladminDashboard/usermanager";
import FeaturesPage from "./pages/Features";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import LegalHubPage from "./pages/LegalPage";
import PricingPage from "./pages/Pricing";
import SuperAdminUsersPage from "./Dashboards/superAdminDashboard/Allusers";
import { BottomNav } from "./components/BottomNav";   // ← ADDED
import SchoolDetailsManager from "./Dashboards/schooladminDashboard/schoolDetails";
import AcademicManager from "./Dashboards/schooladminDashboard/AcademicManager";
import CurriculumManager from "./Dashboards/schooladminDashboard/CurriculumManager";
import DisciplineManager from "./Dashboards/schooladminDashboard/DisciplineManager";
import EventsManager from "./Dashboards/schooladminDashboard/EventsManager";
import ExamsManager from "./Dashboards/schooladminDashboard/ExamManager";
import ExpensesManager from "./Dashboards/schooladminDashboard/ExpensesManager";
import GradingScalesManager from "./Dashboards/schooladminDashboard/GradingScalesManager";
import TimetableManager from "./Dashboards/schooladminDashboard/TimetableManager";
import NotificationManager from "./Dashboards/schooladminDashboard/NotificationManager";
import ReportCardsManager from "./Dashboards/schooladminDashboard/ReportCardManager";
import AttendanceManager from "./Dashboards/schooladminDashboard/AttendanceManager";
import FinanceManager from "./Dashboards/schooladminDashboard/FinanceManager";
import { StudentDAshboard } from "./pages/Dashboards/studentDashboard";
import StudentProfile from "./Dashboards/studentDashboard/ProfileManager";
import StudentTimetable from "./Dashboards/studentDashboard/StudentTimetable";
import StudentAttendance from "./Dashboards/studentDashboard/AttendanceManager";
import StudentExamResults from "./Dashboards/studentDashboard/examsManager";
import StudentReportCards from "./Dashboards/studentDashboard/ReportCardManager";
import StudentFees from "./Dashboards/studentDashboard/feesManager";
import StudentEvents from "./Dashboards/studentDashboard/eventsManager";
import StudentNotifications from "./Dashboards/studentDashboard/NotificationManager";
import StudentHomework from "./Dashboards/studentDashboard/StudentHomework";
import StudentAnalytics from "./Dashboards/studentDashboard/Analytics";

// Wrapper for dynamic titles
const TitleManager = () => {
  useDocumentTitle();
  return <Outlet />;
};

// Wrapper that adds the mobile bottom nav for public-facing pages
const PublicLayout = () => {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
};

const App = () => {
  const Router = createBrowserRouter([
    {
      element: <TitleManager />,
      errorElement: <Error />,
      children: [
        {
          element: <PublicLayout />,   // ← wraps public routes with BottomNav
          children: [
            { path: '/', element: <Home /> },
            { path: '/features', element: <FeaturesPage /> },
            { path: '/pricing', element: <PricingPage /> },
            { path: '/about', element: <AboutPage /> },
            { path: '/contact', element: <ContactPage /> },
            { path: '/Login', element: <Login /> },
            { path: '/legal', element: <LegalHubPage /> },
          ],
        },

        
        // dashboards stay as they are
        {
          path: '/superAdmin-dashboard',
          element: (<ProtectedRoutes><SuperAdminDashBoard /></ProtectedRoutes>),
          errorElement: <Error />,
          children: [
            { index: true, element: <SchoolDashboard /> },
            { path: 'schools', element: <ManageSchools /> },
            { path: 'schoolAdmins', element: <SchoolAdminManager /> },
            { path: 'users', element: <SuperAdminUsersPage /> },
          ],
        },
        {
          path: '/student-dashboard',
          element: (<ProtectedRoutes><StudentDAshboard /></ProtectedRoutes>),
          errorElement: <Error />,
          children: [
            { index: true, element: <SchoolDashboard /> },
            { path: 'analytics', element: <StudentAnalytics /> },
            { path: 'profile', element: <StudentProfile /> },
            { path: 'timetable', element: <StudentTimetable /> },
            { path: 'attendance', element: <StudentAttendance /> },
            { path: 'exams', element: <StudentExamResults /> },
            { path: 'reportcards', element: <StudentReportCards /> },
            { path: 'fees', element: <StudentFees /> },
            { path: 'events', element: <StudentEvents /> },
            { path: 'notifications', element: <StudentNotifications /> },
            { path: 'homework', element: <StudentHomework /> },
          ],
        },
        {
          path: '/schoolAdmin-dashboard',
          element: (<ProtectedRoutes><SchoolAdminDashBoard /></ProtectedRoutes>),
          errorElement: <Error />,
          children: [
            { index: true, element: <SchoolDashboard /> },
            { path: 'schoolDetails', element: <SchoolDetailsManager /> },

            { path: 'academic', element: <AcademicManager /> },
            { path: 'curriculum', element: <CurriculumManager /> },
            { path: 'discipine', element: <DisciplineManager /> },
            { path: 'events', element: <EventsManager /> },
            { path: 'exams', element: <ExamsManager /> },
            { path: 'expenses', element: <ExpensesManager /> },
            { path: 'gradeScale', element: <GradingScalesManager /> },
            { path: 'timetable', element: <TimetableManager /> },
            { path: 'reportcards', element: <ReportCardsManager /> },
            { path: 'attendance', element: <AttendanceManager /> },
            { path: 'fees', element: <FinanceManager /> },
            { path: 'AllTerms', element: <TermManager /> },
            { path: 'AllStudents', element: <StudentManager /> },
            { path: 'userManagers', element: <UserManager /> },
            { path: 'notifications', element: <NotificationManager /> },
          ],
        },
      ]
    }
  ]);

  return (
    <>
      <RouterProvider router={Router} />
    </>
  );
};

export default App;