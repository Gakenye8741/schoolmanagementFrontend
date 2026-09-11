import { Navbar } from "../../components/Navbar"
import { AdminLayout } from "../../Dashboards/DashboardDesigns/AdminLayout"


export const SuperAdminDashBoard = () => {
  return (
    <div className="h-screen mt-0">
      <Navbar/>
      <AdminLayout/>        
    </div>
  )
}
