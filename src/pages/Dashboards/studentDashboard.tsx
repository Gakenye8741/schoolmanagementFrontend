import { Navbar } from "../../components/Navbar"
import { StudentLayout } from "../../Dashboards/DashboardDesigns/StudentLayout"


export const StudentDAshboard = () => {
  return (
    <div className="h-screen mt-0">
      <Navbar/>
      <StudentLayout/>        
    </div>
  )
}
