import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom"
import Home from "./pages/Home";
import About  from "./pages/About";
import Admission from "./pages/Admission";
// import Register from "./pages/Login & Register/Register";
import Login from "./pages/Login & Register/Login";
import ProtectedRoutes from "./components/ProtectedRoutes";
import SchoolDashboard from "./pages/schoolDashboard";
import { useDocumentTitle } from "./components/useDocumentTitle";
import { SuperAdminDashBoard } from "./pages/Dashboards/superAdminDashboard";
import ManageSchools from "./Dashboards/superAdminDashboard/schoolManager";
import SchoolAdminManager from "./Dashboards/superAdminDashboard/manageSchoolAdmins";
import { SchoolAdminDashBoard } from "./pages/Dashboards/schoolAdminDAshboard";
import RegisterSchoolMemberManager from "./Dashboards/schooladminDashboard/userRegistrations";
import TermManager from "./Dashboards/schooladminDashboard/academicTerm";
import Error from "./components/Error"; // Import the error component
import ClassManager from "./Dashboards/schooladminDashboard/classMAnager";
import { StudentManager } from "./Dashboards/schooladminDashboard/studentMAnager";
import { UserManager } from "./Dashboards/schooladminDashboard/usermanager";

// Wrapper component to manage dynamic titles and render child routes via <Outlet />
const TitleManager = () => {
  useDocumentTitle();
  return <Outlet />;
};

const App = () => {
  const Router = createBrowserRouter([
    {
      element: <TitleManager />,
      errorElement: <Error />, // Global error boundary fallback for route errors
      children: [
        {
          path: '/',
          element: <Home/>
        },
        {
          path: '/About',
          element: <About/>
        },
        {
          path: '/Admissions',
          element: <Admission/>
        },
        {
          path: '/Register',
          // element: <Register/>
        },
        {
          path: '/LOgin',
          element: <Login/>
        },
        {
          path: '/superAdmindashboard',
          element: (
            <ProtectedRoutes>
              <SuperAdminDashBoard/>
            </ProtectedRoutes>
          ),
          errorElement: <Error />,
          children: [
            { index: true, element: <SchoolDashboard /> },
            { path: 'AllUsers', element: <ManageSchools /> },
            { path: 'schoolAdmins', element: <SchoolAdminManager/> },
           
            
          ],
        },
         {
          path: '/schoolAdmindashboard',
          element: (
            <ProtectedRoutes>
              <SchoolAdminDashBoard/>
            </ProtectedRoutes>
          ),
          errorElement: <Error />,
          children: [
            { index: true, element: <SchoolDashboard /> },
            { path: 'AllUsers', element: <RegisterSchoolMemberManager /> },
            { path: 'AllTerms', element: <TermManager/> },
            { path: 'AllClasses', element: <ClassManager /> },
            { path: 'AllStudents', element: <StudentManager/> },
            { path: 'userManagers', element: <UserManager /> },

          ],
        },
      ]
    }
  ]);

  return (
    <>
      <RouterProvider router={Router}/>
    </>
  );
};

export default App;