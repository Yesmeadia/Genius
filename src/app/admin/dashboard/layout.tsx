"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Moon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardSidebar } from "./components/DashboardSidebar";
import { DashboardDataProvider } from "./components/DashboardDataContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  // Determine active tab/page title based on pathname
  const getPageTitle = () => {
    if (pathname === "/admin/dashboard") return "Dashboard Overview";
    if (pathname.includes("/students-data")) return "Student Management";
    if (pathname.includes("/guardian-data")) return "Guardian Database";
    if (pathname.includes("/guest-registry")) return "Guest Registry";
    if (pathname.includes("/yesian-network")) return "Yesian Network";
    if (pathname.includes("/local-staff")) return "Local Staff Database";
    if (pathname.includes("/access-pass")) return "Access Pass Center";
    if (pathname.includes("/reports")) return "Analytics & Reports";
    if (pathname.includes("/master-export")) return "Master Export Center";
    if (pathname.includes("/settings")) return "Portal Configuration";
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
          <header className="bg-white/70 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-0 border-b border-slate-100">
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

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-[13px] font-normal text-slate-900 leading-none">Administrator</div>
                  <div className="text-[10px] font-normal text-slate-400 uppercase tracking-widest mt-1">Administrator</div>
                </div>
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`} />
                  <AvatarFallback className="bg-indigo-600 text-white font-normal text-xs">AD</AvatarFallback>
                </Avatar>
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
