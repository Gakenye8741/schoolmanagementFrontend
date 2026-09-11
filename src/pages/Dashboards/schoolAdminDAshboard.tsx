import { Navbar } from "../../components/Navbar"
import { SchoolAdminLayout } from "../../Dashboards/DashboardDesigns/schoolAdminLayout"


export const SchoolAdminDashBoard = () => {
  return (
    <div className="h-screen mt-0">
      <Navbar/>
      <SchoolAdminLayout/>        
    </div>
  )
}
