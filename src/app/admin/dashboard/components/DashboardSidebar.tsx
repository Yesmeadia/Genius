"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Download, LogOut, ShieldCheck, CreditCard, User, Users2, BarChart3, GraduationCap, Truck } from "lucide-react";

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onSignOut: () => void;
}

export function DashboardSidebar({ sidebarOpen, setSidebarOpen, onSignOut }: DashboardSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/admin/dashboard" },
    { id: "records", label: "Students data", icon: <Users size={20} />, href: "/admin/dashboard/students-data" },
    { id: "accompaniments", label: "Guardian Data", icon: <ShieldCheck size={20} />, href: "/admin/dashboard/guardian-data" },
    { id: "guests", label: "Guest data", icon: <User size={20} />, href: "/admin/dashboard/guest-registry" },
    { id: "yesians", label: "Yesians", icon: <Users2 size={20} />, href: "/admin/dashboard/yesian-network" },
    { id: "local-staff", label: "Local Staff", icon: <User size={20} />, href: "/admin/dashboard/local-staff" },
    { id: "alumni-achievers", label: "Alumni Achievers", icon: <GraduationCap size={20} />, href: "/admin/dashboard/alumni-achievers" },
    { id: "volunteers", label: "Volunteers", icon: <ShieldCheck size={20} />, href: "/admin/dashboard/volunteers" },
    { id: "awardees", label: "Awardees", icon: <BarChart3 size={20} />, href: "/admin/dashboard/awardee" },
    { id: "driver-staff", label: "Drivers & Staff", icon: <Truck size={20} />, href: "/admin/dashboard/driver-staff" },
    { id: "pass", label: "Access Pass", icon: <CreditCard size={20} />, href: "/admin/dashboard/access-pass" },
    { id: "reports", label: "Reports", icon: <BarChart3 size={20} />, href: "/admin/dashboard/reports" },
    { id: "export", label: "Export Center", icon: <Download size={20} />, href: "/admin/dashboard/master-export" },
  ];

  return (
    <aside className={`bg-white border-r border-slate-100 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'} hidden md:flex h-screen sticky top-0 z-30`}>
      {/* Branding */}
      <div className={`py-10 flex flex-col items-center justify-center w-full transition-all duration-300 ${sidebarOpen ? 'px-6' : 'px-0'}`}>
        <div className="flex items-center justify-center w-full">
          {sidebarOpen ? (
            <div className="flex justify-center w-full bg-white p-1">
              <img src="/yeslogo.png" alt="Logo" className="h-10 w-auto object-contain" />
            </div>
          ) : (
            <div className="flex justify-center w-full">
              <img src="/geniuseicon.png" alt="Icon" className="h-10 w-10 object-contain animate-in fade-in zoom-in duration-500" />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav 
        data-lenis-prevent
        className="flex-1 min-h-0 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar"
      >
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`w-full flex items-center rounded-2xl transition-all duration-200 group ${sidebarOpen ? 'gap-4 px-4 py-3.5' : 'justify-center p-3.5'} ${isActive
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
            </Link>
          );
        })}
      </nav>

      {/* Logout/Footer */}
      <div className="p-6 border-t border-slate-50">
        <button
          onClick={onSignOut}
          className={`flex items-center text-slate-400 hover:text-red-500 w-full transition-colors group ${sidebarOpen ? 'gap-4 px-4 py-3' : 'justify-center p-3'}`}
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
