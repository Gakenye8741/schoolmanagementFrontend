import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSideNav } from "../DashboardDesigns/AdminSIdenav";
import { Menu, ChevronLeft, ShieldCheck, Sparkles, X } from "lucide-react";
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
      {/* ───── Local animations ───── */}
      <style>{`
        @keyframes slideRight {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-slide-right { animation: slideRight 0.32s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .anim-fade-in     { animation: fadeIn 0.3s ease-out both; }
        .anim-float-in    { animation: floatIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) both; }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.25);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.45);
        }

        @media (prefers-reduced-motion: reduce) {
          .anim-slide-right, .anim-fade-in, .anim-float-in {
            animation: none !important;
          }
        }
      `}</style>

      {/* Top Sticky Navigation */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-base-100/90 border-b border-base-300 shadow-sm transition-all duration-300">
        <Navbar />
      </header>

      {/* Main App Workspace Shell */}
      <div className="flex flex-1 relative min-h-[calc(100vh-4rem)]">
        {/* Mobile Floating Drawer Trigger */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 p-4 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center ring-4 ring-white/20"
          style={{ backgroundColor: primaryColor }}
          aria-label="Open Sidebar Menu"
        >
          <Menu size={22} />
        </button>

        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] z-30 bg-base-200/60 backdrop-blur-md border-r border-base-300/70 shadow-sm transition-all duration-300 ease-in-out shrink-0 ${
            isCollapsed ? "w-[88px]" : "w-[280px]"
          }`}
        >
          {/* Sidebar Header & Collapse Toggle */}
          <div className="flex items-center justify-between px-3 py-3.5 border-b border-base-300/60 shrink-0 gap-2">
            {!isCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0 anim-fade-in">
                <div 
                  className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0" 
                  style={{ backgroundColor: secondaryColor }}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-base-content/50 truncate">
                    {role?.replace('_', ' ') || 'Admin'} Portal
                  </p>
                  <p className="text-xs font-bold text-base-content truncate">
                    {school?.name || 'Management Hub'}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-xl bg-base-300/60 hover:bg-base-300 text-base-content/70 transition-all duration-300 hover:scale-105 shadow-sm ml-auto shrink-0"
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronLeft 
                size={18} 
                className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Sidebar Navigation Items Container */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
            <AdminSideNav 
              onNavItemClick={() => {}} 
              isCollapsed={isCollapsed} 
            />
          </div>

          {/* Sidebar Footer Branding / Status Strip */}
          {!isCollapsed && (
            <div className="p-3 mx-2 mb-3 rounded-2xl bg-base-300/40 border border-base-300/60 flex items-center gap-3 transition-all duration-300 hover:bg-base-300/70 shrink-0 anim-fade-in">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                <ShieldCheck size={18} />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold truncate">Secure Session</p>
                <p className="text-[10px] text-base-content/60 capitalize flex items-center gap-1 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0"></span> 
                  {role?.replace('_', ' ') || 'Admin'} Active
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Slide-Over Drawer & Backdrop */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm anim-fade-in md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[320px] bg-base-100 text-base-content shadow-2xl md:hidden flex flex-col anim-slide-right">
              <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200/60 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 font-bold"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Sparkles size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-base-content/50 truncate">
                      {role?.replace('_', ' ') || 'Admin'} Portal
                    </p>
                    <p className="text-sm font-bold text-base-content truncate">
                      {school?.name || 'Management Hub'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-base-300 transition-colors shrink-0"
                  aria-label="Close Sidebar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                <AdminSideNav onNavItemClick={() => setSidebarOpen(false)} isCollapsed={false} />
              </div>

              <div className="p-3 border-t border-base-300 bg-base-300/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ShieldCheck size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">Secure Session</p>
                    <p className="text-[10px] text-base-content/60 capitalize flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                      {role?.replace('_', ' ') || 'Admin'} Active
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* Dynamic Main Workspace Outlet */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-base-100">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto anim-float-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};