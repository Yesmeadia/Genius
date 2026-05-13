"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Download, LogOut, ShieldCheck,
  CreditCard, User, Users2, BarChart3, GraduationCap,
  Truck, Trash2, Plus, Award, ScrollText, ChevronDown, ChevronRight,
  ClipboardList, Settings, Briefcase, Box, CheckCircle, Scan, MessageSquare, MapPin, Camera, Bed, UserCheck
} from "lucide-react";

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  onSignOut: () => void;
}

export function DashboardSidebar({ sidebarOpen, setSidebarOpen, onSignOut }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    management: true,
    personnel: false,
    utilities: false,
    system: false,
  });

  // Automatically expand category if a child item is active
  useEffect(() => {
    const categoryMapping = [
      { id: "management", hrefs: ["/admin/dashboard/students-data", "/admin/dashboard/guardian-data", "/admin/dashboard/guest-registry", "/admin/dashboard/yesian-network", "/admin/dashboard/alumni-achievers", "/admin/dashboard/awardee", "/admin/dashboard/qiraath"] },
      { id: "personnel", hrefs: ["/admin/dashboard/local-staff", "/admin/dashboard/volunteers", "/admin/dashboard/scout-team", "/admin/dashboard/driver-staff", "/admin/dashboard/media"] },
      { id: "utilities", hrefs: ["/admin/dashboard/access-pass", "/admin/dashboard/certificates", "/admin/dashboard/reports", "/admin/dashboard/master-export", "/admin/dashboard/attendance-track", "/admin/dashboard/gsuit"] },
      { id: "system", hrefs: ["/admin/dashboard/recycle-bin"] }
    ];

    categoryMapping.forEach(cat => {
      if (cat.hrefs.some(href => pathname === href || pathname.startsWith(href + "/"))) {
        setExpandedCategories(prev => ({ ...prev, [cat.id]: true }));
      }
    });
  }, [pathname]);

  const toggleCategory = (categoryId: string) => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
      setExpandedCategories(prev => ({ ...prev, [categoryId]: true }));
      return;
    }
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const categories = [
    {
      id: "general",
      label: "General",
      color: "indigo",
      icon: <LayoutDashboard size={18} />,
      items: [
        { id: "overview", label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/admin/dashboard" },
      ]
    },
    {
      id: "management",
      label: "Registrations",
      color: "indigo",
      icon: <ClipboardList size={18} />,
      items: [
        { id: "records", label: "Students", icon: <Users size={18} />, href: "/admin/dashboard/students-data" },
        { id: "accompaniments", label: "Guardians", icon: <ShieldCheck size={18} />, href: "/admin/dashboard/guardian-data" },
        { id: "guests", label: "Guests", icon: <User size={18} />, href: "/admin/dashboard/guest-registry" },
        { id: "yesians", label: "Yesians", icon: <Users2 size={18} />, href: "/admin/dashboard/yesian-network" },
        { id: "alumni", label: "Alumni", icon: <GraduationCap size={18} />, href: "/admin/dashboard/alumni-achievers" },
        { id: "awardees", label: "Awardees", icon: <Award size={18} />, href: "/admin/dashboard/awardee" },
        { id: "qiraath", label: "Qiraath", icon: <Award size={18} />, href: "/admin/dashboard/qiraath" },
      ]
    },
    {
      id: "personnel",
      label: "Personnel",
      color: "amber",
      icon: <Briefcase size={18} />,
      items: [
        { id: "local-staff", label: "Local Staff", icon: <User size={18} />, href: "/admin/dashboard/local-staff" },
        { id: "volunteers", label: "Volunteers", icon: <ShieldCheck size={18} />, href: "/admin/dashboard/volunteers" },
        { id: "scout-team", label: "Scout Team", icon: <ShieldCheck size={18} />, href: "/admin/dashboard/scout-team" },
        { id: "driver-staff", label: "Drivers & Staff", icon: <Truck size={18} />, href: "/admin/dashboard/driver-staff" },
        { id: "media", label: "Media", icon: <Camera size={18} />, href: "/admin/dashboard/media" },
      ]
    },
    {
      id: "utilities",
      label: "Utilities",
      color: "emerald",
      icon: <Box size={18} />,
      items: [
        { id: "gsuit", label: "GSuit", icon: <Bed size={18} />, href: "/admin/dashboard/gsuit" },
        { id: "pass", label: "Access Pass", icon: <CreditCard size={18} />, href: "/admin/dashboard/access-pass" },
        { id: "certificates", label: "Certificates", icon: <ScrollText size={18} />, href: "/admin/dashboard/certificates" },
        { id: "reports", label: "Reports", icon: <BarChart3 size={18} />, href: "/admin/dashboard/reports" },
        { id: "print-data", label: "Print Data", icon: <ScrollText size={18} />, href: "/admin/dashboard/print-data" },
        { id: "mark-attendance", label: "Mark Attendance", icon: <UserCheck size={18} />, href: "/admin/dashboard/attendance" },
        { id: "attendance", label: "Attendance Track", icon: <CheckCircle size={18} />, href: "/admin/dashboard/attendance-track" },
        { id: "feedback", label: "Feedback", icon: <MessageSquare size={18} />, href: "/admin/dashboard/feedback" },
        { id: "export", label: "Export Center", icon: <Download size={18} />, href: "/admin/dashboard/master-export" },
        { id: "add-registration", label: "New Entry", icon: <Plus size={18} />, href: "/admin/dashboard/registration", prominent: true },
      ]
    },
    {
      id: "system",
      label: "System",
      color: "rose",
      icon: <Settings size={18} />,
      items: [
        { id: "recycle-bin", label: "Recycle Bin", icon: <Trash2 size={18} />, href: "/admin/dashboard/recycle-bin" },
      ]
    }
  ];

  const getColorClass = (color: string, type: 'text' | 'bg' | 'border' | 'hoverBg' | 'shadow') => {
    const colors: Record<string, any> = {
      indigo: { text: 'text-indigo-600', bg: 'bg-indigo-600', border: 'border-indigo-100', hoverBg: 'hover:bg-indigo-50', shadow: 'shadow-indigo-100' },
      amber: { text: 'text-amber-600', bg: 'bg-amber-600', border: 'border-amber-100', hoverBg: 'hover:bg-amber-50', shadow: 'shadow-amber-100' },
      emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600', border: 'border-emerald-100', hoverBg: 'hover:bg-emerald-50', shadow: 'shadow-emerald-100' },
      rose: { text: 'text-rose-600', bg: 'bg-rose-600', border: 'border-rose-100', hoverBg: 'hover:bg-rose-50', shadow: 'shadow-rose-100' },
    };
    return colors[color][type];
  };

  return (
    <aside className={`bg-white border-r border-slate-100 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-64' : 'w-20'} hidden md:flex h-screen sticky top-0 z-30`}>
      {/* Branding */}
      <div className={`py-8 flex flex-col items-center justify-center w-full transition-all duration-300 ${sidebarOpen ? 'px-6' : 'px-0'}`}>
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
        className="flex-1 min-h-0 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar"
      >
        {categories.map((category) => {
          const isExpanded = expandedCategories[category.id] || false;
          const isSingleItem = category.items.length === 1 && category.id === "general";

          if (isSingleItem) {
            const item = category.items[0];
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center rounded-xl transition-all duration-200 group mb-2 ${sidebarOpen ? 'gap-3 px-4 py-2.5' : 'justify-center p-2.5'} ${isActive
                  ? `${getColorClass(category.color, 'bg')} text-white shadow-lg ${getColorClass(category.color, 'shadow')}`
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'} transition-colors`}>
                  {item.icon}
                </div>
                {sidebarOpen && (
                  <span className={`text-[13px] font-medium tracking-tight ${isActive ? 'text-white' : 'text-slate-600'}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <div key={category.id} className="mb-2">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between rounded-xl transition-all duration-200 group ${sidebarOpen ? 'px-4 py-2.5' : 'justify-center p-2.5'} ${isExpanded && sidebarOpen ? `text-slate-900 ${getColorClass(category.color, 'hoverBg')}/30` : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${isExpanded && sidebarOpen ? getColorClass(category.color, 'text') : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {category.icon}
                  </div>
                  {sidebarOpen && (
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${isExpanded ? 'text-slate-600' : 'text-slate-400'} group-hover:text-slate-600`}>
                      {category.label}
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={14} className="text-slate-300" />
                  </div>
                )}
              </button>

              {/* Sub-items */}
              {isExpanded && sidebarOpen && (
                <div className="mt-1 ml-4 pl-4 border-l border-slate-100 space-y-1 animate-in slide-in-from-top-1 duration-200">
                  {category.items.map((item: any) => {
                    const isActive = pathname === item.href;
                    const isProminent = item.prominent;

                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        className={`w-full flex items-center rounded-xl transition-all duration-200 group px-4 py-2 ${isActive
                          ? `${getColorClass(category.color, 'text')} ${getColorClass(category.color, 'hoverBg')} font-semibold`
                          : isProminent
                            ? 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 font-medium'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                      >
                        <span className={`text-[12.5px] tracking-tight ${isActive ? getColorClass(category.color, 'text') : isProminent ? 'text-indigo-600' : 'text-slate-500'}`}>
                          {item.label}
                        </span>
                        {isProminent && sidebarOpen && (
                          <Plus size={12} className="ml-auto text-indigo-400" />
                        )}
                        {item.external && sidebarOpen && (
                          <ChevronRight size={12} className="ml-auto text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Logout/Footer */}
      <div className="p-4 border-t border-slate-50">
        <button
          onClick={onSignOut}
          className={`flex items-center text-slate-400 hover:text-rose-600 w-full transition-all duration-200 group ${sidebarOpen ? 'gap-3 px-4 py-2.5 rounded-xl hover:bg-rose-50' : 'justify-center p-2.5 rounded-xl hover:bg-rose-50'}`}
        >
          <div className="group-hover:scale-110 transition-transform">
            <LogOut size={18} />
          </div>
          {sidebarOpen && <span className="text-[13px] font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
