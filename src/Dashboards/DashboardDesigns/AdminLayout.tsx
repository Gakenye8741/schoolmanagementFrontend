import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSideNav } from "../DashboardDesigns/AdminSIdenav";
import { Menu, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Building2, Activity, Users, DollarSign, FileText } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { useSelector } from "react-redux";
import type { RootState } from "../../App/store";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { user, isAuthenticated, role } = useSelector((state: RootState) => state.auth);
  const schoolId = user?.schoolId || user?.user?.schoolId;

  const { data: school } = useGetSchoolByIdQuery(schoolId, {
    skip: !isAuthenticated || !schoolId || role === 'super_admin',
  });

  const primaryColor = school?.primaryColor || '#6366f1';
  const secondaryColor = school?.secondaryColor || '#f59e0b';

  return (
    <div 
      className="min-h-screen flex flex-col bg-base-100 text-base-content selection:bg-primary selection:text-primary-content"
      style={{
        '--school-primary': primaryColor,
        '--school-secondary': secondaryColor,
      } as React.CSSProperties}
    >
      {/* Top Sticky Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-base-100/90 border-b border-base-300 shadow-sm transition-all duration-300">
        <Navbar />
      </header>

      {/* Main App Workspace Shell */}
      <div className="flex flex-1 relative min-h-[calc(100vh-4rem)]">
        {/* Mobile Floating Drawer Trigger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 p-3.5 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center ring-4 ring-primary/20"
          style={{ backgroundColor: primaryColor }}
          aria-label="Open Sidebar Menu"
        >
          <Menu size={22} />
        </button>

        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden md:flex flex-col sticky top-0 h-[calc(100vh-4rem)] z-30 bg-base-200/95 backdrop-blur-md border-r border-base-300 shadow-2xl transition-all duration-300 ease-in-out shrink-0 ${
            isCollapsed ? "w-20" : "w-72"
          }`}
        >
          {/* Sidebar Header & Collapse Toggle */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-base-300/80 bg-base-200 shrink-0">
            {!isCollapsed && (
              <div className="flex items-center gap-2 overflow-hidden">
                <div 
                  className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" 
                  style={{ backgroundColor: secondaryColor }}
                />
                <span className="text-xs font-black uppercase tracking-widest text-base-content/70 truncate">
                  {school?.name ? `${school.name} Portal` : 'Management Hub'}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-xl bg-base-300/70 hover:bg-base-300 text-base-content/80 transition-all duration-200 hover:scale-105 shadow-sm ml-auto"
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* Sidebar Navigation Items Container (Fully Visible, Scrollable) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 custom-scrollbar">
            <AdminSideNav 
              onNavItemClick={() => {}} 
              isCollapsed={isCollapsed} 
            />
          </div>

          {/* Sidebar Footer Branding / Status Strip */}
          {!isCollapsed && (
            <div className="p-3 mx-3 mb-3 rounded-2xl bg-base-300/50 border border-base-300 flex items-center gap-3 transition-all duration-300 hover:bg-base-300/80 shrink-0">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                <ShieldCheck size={18} />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate">Secure Session</p>
                <p className="text-[10px] text-base-content/60 capitalize flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success"></span> {role?.replace('_', ' ') || 'Admin'} Active
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Slide-Over Drawer & Backdrop */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-base-200 text-base-content border-r border-base-300 shadow-2xl md:hidden flex flex-col animate-slideRight">
              <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: secondaryColor }} />
                  <span className="font-black text-sm uppercase tracking-wider text-primary" style={{ color: primaryColor }}>
                    {school?.name || 'Admin Portal'}
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="btn btn-sm btn-ghost btn-square rounded-xl hover:bg-base-300"
                  aria-label="Close Sidebar"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                <AdminSideNav onNavItemClick={() => setSidebarOpen(false)} isCollapsed={false} />
              </div>
              <div className="p-4 border-t border-base-300 bg-base-300/30 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: primaryColor }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold">Role: {role?.replace('_', ' ') || 'Admin'}</p>
                  <p className="text-[10px] text-base-content/60">Multi-Tenant Secured Environment</p>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Dynamic Main Workspace Outlet */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-base-100">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto animate-fadeIn">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};