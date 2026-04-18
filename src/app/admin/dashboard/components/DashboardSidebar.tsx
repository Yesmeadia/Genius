"use client";

import { LayoutDashboard, Users, Download, LogOut, ChevronRight, Settings, Bell, ShieldCheck, CreditCard } from "lucide-react";

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSignOut: () => void;
}

export function DashboardSidebar({ sidebarOpen, activeTab, setActiveTab, onSignOut }: DashboardSidebarProps) {
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    { id: "records", label: "Student Data", icon: <Users size={20} /> },
    { id: "accompaniments", label: "Guardian Data", icon: <ShieldCheck size={20} /> },
    { id: "pass", label: "Access Pass", icon: <CreditCard size={20} /> },
    { id: "export", label: "Export Center", icon: <Download size={20} /> },
  ];

  return (
    <aside className={`bg-white border-r border-slate-100 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-68' : 'w-20'} hidden md:flex h-screen sticky top-0 z-30`}>
      {/* Branding */}
      <div className="p-8 flex items-center gap-3">
        <div className="bg-white p-1">
          <img src="/yeslogo.png" alt="Logo" className="h-10 w-auto" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-grow px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
            >
              <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} transition-colors`}>
                {item.icon}
              </div>
              {sidebarOpen && (
                <span className={`text-[13px] font-normal tracking-tight ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout/Footer */}
      <div className="p-6 border-t border-slate-50 mt-auto">
        <button
          onClick={onSignOut}
          className="flex items-center gap-4 text-slate-400 hover:text-red-500 w-full px-4 py-3 transition-colors group"
        >
          <div className="group-hover:translate-x-1 transition-transform">
            <LogOut size={20} />
          </div>
          {sidebarOpen && <span className="text-[13px] font-normal">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
