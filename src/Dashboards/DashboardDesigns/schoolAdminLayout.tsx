import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, X } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { useSelector } from "react-redux";
import type { RootState } from "../../App/store";
import { useGetSchoolByIdQuery } from "../../features/Apis/School.Api";
import { SchoolAdminSideNav } from "./schoolAdminSideNav";

export const SchoolAdminLayout = () => {
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
      {/* ── Local styles: scrollbar + animations ── */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.25);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.45);
        }
        @keyframes slideRight {
          from { transform: translateX(-100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-slide-right { animation: slideRight 0.32s cubic-bezier(0.22,1,0.36,1) both; }
        .anim-fade-in     { animation: fadeIn 0.3s ease-out both; }
        .anim-float-in    { animation: floatIn 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .anim-slide-right, .anim-fade-in, .anim-float-in { animation: none !important; }
        }
      `}</style>

      {/* Fixed Navbar (comes from your global Navbar component) */}
      <Navbar />

      {/* Shell — pt-16 makes room for the fixed navbar height (4rem) */}
      <div className="flex flex-1 pt-16">
        {/* ── Mobile FAB ── */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 p-4 text-white rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center ring-4 ring-white/25"
          style={{ backgroundColor: primaryColor }}
          aria-label="Open Sidebar Menu"
        >
          <Menu size={20} />
        </button>

        {/* ── Desktop Collapsible Sidebar ── */}
        <aside
          className={`hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] z-30 bg-base-200/60 backdrop-blur-md border-r border-base-300/60 shadow-sm transition-[width] duration-300 ease-in-out shrink-0 ${
            isCollapsed ? "w-[84px]" : "w-[280px]"
          }`}
        >
          {/* Sidebar header + collapse toggle */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-base-300/50 shrink-0 gap-2">
            {!isCollapsed && (
              <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow"
                  style={{ backgroundColor: secondaryColor }}
                />
                <span className="text-[11px] font-black uppercase tracking-widest text-base-content/70 truncate">
                  {school?.name || "Management Hub"}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-xl bg-base-200 hover:bg-base-300 text-base-content/70 hover:text-base-content transition-all duration-300 hover:scale-105 shadow-sm ml-auto shrink-0"
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronLeft
                size={16}
                className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {/* Scrollable nav */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
            <SchoolAdminSideNav
              onNavItemClick={() => {}}
              isCollapsed={isCollapsed}
            />
          </div>

          {/* Footer status chip */}
          {!isCollapsed && (
            <div className="p-3 mx-2 mb-2 rounded-2xl bg-base-100/70 border border-base-300/60 flex items-center gap-3 shadow-sm shrink-0 anim-fade-in">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 font-bold shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <ShieldCheck size={16} />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-[11px] font-bold truncate">Secure Session</p>
                <p className="text-[10px] text-base-content/60 capitalize flex items-center gap-1.5 font-medium truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
                  {role?.replace('_', ' ') || 'Admin'} Active
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* ── Mobile Drawer + Backdrop ── */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm anim-fade-in md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed top-0 left-0 bottom-0 z-50 w-[85vw] max-w-[320px] bg-base-100 shadow-2xl md:hidden flex flex-col anim-slide-right">
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-base-300 bg-base-200/60 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Sparkles size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-black tracking-widest text-base-content/50 truncate">
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

              {/* Drawer nav */}
              <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                <SchoolAdminSideNav
                  onNavItemClick={() => setSidebarOpen(false)}
                  isCollapsed={false}
                />
              </div>

              {/* Drawer footer */}
              <div className="p-3 border-t border-base-300 bg-base-300/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <ShieldCheck size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold truncate">Secure Session</p>
                    <p className="text-[10px] text-base-content/60 capitalize flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
                      {role?.replace('_', ' ') || 'Admin'} Active
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* ── Main content ── */}
        <main className="flex-1 flex flex-col min-w-0 min-h-[calc(100vh-4rem)] overflow-y-auto bg-base-100">
          <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] w-full mx-auto anim-float-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};