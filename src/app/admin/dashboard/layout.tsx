"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Moon, Bell, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardSidebar } from "./components/DashboardSidebar";
import { DashboardDataProvider } from "./components/DashboardDataContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  // Determine active tab/page title based on pathname
  const getPageTitle = () => {
    if (pathname === "/admin/dashboard") return "Dashboard Overview";

    // Students
    if (pathname.startsWith("/admin/dashboard/students-data")) return "Student Management";
    if (pathname.startsWith("/admin/dashboard/student/")) return "Student Profile";

    // Guardians
    if (pathname.includes("/guardian-data")) return "Guardian Database";

    // Guests
    if (pathname.startsWith("/admin/dashboard/guest-registry")) return "Guest Registry";
    if (pathname.startsWith("/admin/dashboard/guest/")) return "Guest Profile";
    if (pathname.startsWith("/admin/dashboard/gsuit")) return "GSuit Management";

    // Yesians
    if (pathname.startsWith("/admin/dashboard/yesian-network")) return "Yesian Network";
    if (pathname.startsWith("/admin/dashboard/yesian/")) return "Yesian Profile";

    // Local Staff
    if (pathname.startsWith("/admin/dashboard/local-staff")) {
      const parts = pathname.split("/").filter(Boolean);
      return parts.length > 3 ? "Local Staff Profile" : "Local Staff Database";
    }

    // Alumni
    if (pathname.startsWith("/admin/dashboard/alumni-achievers")) {
      const parts = pathname.split("/").filter(Boolean);
      return parts.length > 3 ? "Alumni Profile" : "Alumni Achievers Data";
    }

    // Volunteers
    if (pathname.startsWith("/admin/dashboard/volunteers")) {
      const parts = pathname.split("/").filter(Boolean);
      return parts.length > 3 ? "Volunteer Profile" : "Volunteers Registration";
    }

    // Awardees
    if (pathname.startsWith("/admin/dashboard/awardee")) {
      const parts = pathname.split("/").filter(Boolean);
      return parts.length > 3 ? "Awardee Profile" : "Awardee Management";
    }

    // Qiraath
    if (pathname.startsWith("/admin/dashboard/qiraath")) {
      const parts = pathname.split("/").filter(Boolean);
      return parts.length > 3 ? "Qiraath Profile" : "Qiraath Contest Data";
    }

    // Scout Team
    if (pathname.startsWith("/admin/dashboard/scout-team")) {
      const parts = pathname.split("/").filter(Boolean);
      return parts.length > 3 ? "Scout Team Member Profile" : "Scout Team Registry";
    }

    if (pathname.includes("/driver-staff")) return "Drivers & Staff Registry";
    if (pathname.startsWith("/admin/dashboard/media")) {
      const parts = pathname.split("/").filter(Boolean);
      return parts.length > 3 ? "Media Profile" : "Media Registry";
    }
    if (pathname.includes("/access-pass")) return "Access Pass Center";
    if (pathname.includes("/certificates")) return "Certificate Center";
    if (pathname.includes("/reports")) return "Analytics & Reports";
    if (pathname.includes("/master-export")) return "Master Export Center";
    if (pathname.includes("/recycle-bin")) return "Recycle Bin";
    if (pathname.includes("/attendance-track")) return "Attendance Tracker";
    if (pathname.includes("/attendance")) return "Mark Attendance";
    if (pathname.includes("/registration")) return "Direct Registration";
    if (pathname.includes("/settings")) return "Portal Configuration";
    if (pathname.includes("/feedback")) return "Feedback Portal";
    if (pathname.includes("/profile")) return "My Profile";
    if (pathname.includes("/print-data")) return "Print Data";
    return "Admin Dashboard";
  };

  if (authLoading || !hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-figtree">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-normal tracking-widest uppercase text-slate-400">Restoring Experience</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <DashboardDataProvider>
      <div className="bg-slate-50 flex font-figtree font-normal min-h-screen">
        <DashboardSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onSignOut={handleSignOut}
        />

        <div className="flex-grow flex flex-col min-w-0">
          <header className="bg-white/70 backdrop-blur-md sticky top-0 z-40 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-0 border-b border-slate-100">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-2xl h-10 w-10 text-slate-400 hover:bg-slate-50 relative"
              >
                <Menu size={20} />
                {!sidebarOpen && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                )}
              </Button>

              <div className="md:hidden">
                <img src="/yeslogo.png" alt="Logo" className="h-6 w-auto" />
              </div>

              <div>
                <h1 className="text-lg md:text-xl font-normal text-slate-900 leading-none">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto justify-end">
              <div className="flex items-center gap-2 pr-4 lg:pr-6 border-r border-slate-100">
                <Button variant="ghost" size="icon" className="rounded-2xl h-10 w-10 text-slate-400 hover:bg-slate-50">
                  <Moon size={20} />
                </Button>
                <div className="relative">
                  <Button variant="ghost" size="icon" className="rounded-2xl h-10 w-10 text-slate-400 hover:bg-slate-50">
                    <Bell size={20} />
                  </Button>
                  <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-normal animate-pulse">1</span>
                </div>
              </div>

              {/* Avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  id="profile-menu-trigger"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-2xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="text-right hidden sm:block">
                    <div className="text-[13px] font-normal text-slate-900 leading-none">
                      {user?.displayName || "Administrator"}
                    </div>
                    <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest mt-1">Super Admin</div>
                  </div>
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                    <AvatarImage src={user?.photoURL ?? "/geniuseicon.png"} />
                    <AvatarFallback className="bg-indigo-600 text-white font-normal text-xs">
                      {(user?.displayName || "AD").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User identity */}
                    <div className="px-4 py-3 border-b border-slate-50">
                      <p className="text-xs font-black text-slate-900 truncate">{user?.displayName || "Administrator"}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      <Link
                        id="dropdown-profile-link"
                        href="/admin/dashboard/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                          <User size={14} className="text-slate-500 group-hover:text-indigo-600" />
                        </div>
                        <span className="font-medium">My Profile</span>
                      </Link>

                      <Link
                        id="dropdown-settings-link"
                        href="/admin/dashboard/settings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                          <Settings size={14} className="text-slate-500 group-hover:text-indigo-600" />
                        </div>
                        <span className="font-medium">Settings</span>
                      </Link>
                    </div>

                    {/* Divider + Sign out */}
                    <div className="border-t border-slate-50 py-1.5">
                      <button
                        id="dropdown-signout-btn"
                        onClick={() => { setDropdownOpen(false); handleSignOut(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-rose-100 flex items-center justify-center transition-colors">
                          <LogOut size={14} className="text-slate-500 group-hover:text-rose-600" />
                        </div>
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="p-4 md:p-10 max-w-[1600px] w-full mx-auto flex flex-col flex-grow">
            {children}

            <footer className="mt-auto pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 font-normal uppercase tracking-widest gap-4 pb-6">
              <div>&copy; {new Date().getFullYear()} YES INDIA FOUNDATION. ALL RIGHTS RESERVED.</div>
              <div>DESIGNED AND DEVELOPED BY CYBERDUCE</div>
            </footer>
          </main>
        </div>
      </div>
    </DashboardDataProvider>
  );
}
