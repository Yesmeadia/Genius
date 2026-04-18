"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  Menu, FileText, Download, LogOut, Filter, X, Bell, Moon, User
} from "lucide-react";
import { locations } from "@/data/locations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Modular Components
import { DashboardSidebar } from "./components/DashboardSidebar";
import { AnalyticsSummary } from "./components/AnalyticsSummary";
import { PerformanceCharts } from "./components/PerformanceCharts";
import AccessPassCenter from "./components/AccessPassCenter";
import { StudentDataTable } from "./components/StudentDataTable";
import { AccompanimentDataTable } from "./components/AccompanimentDataTable";
import { ExportCenter } from "./components/ExportCenter";

interface Registration {
  id: string;
  studentName: string;
  parentage: string;
  className: string;
  gender: string;
  zone: string;
  school: string;
  withParent: boolean;
  parentName?: string;
  parentGender?: string;
  relation?: string;
  createdAt: any;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterAccompaniment, setFilterAccompaniment] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
    if (!user) return;

    const q = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];
      setRegistrations(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Derived filter options
  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(registrations.map(r => r.zone))).sort();
    const schools = Array.from(new Set(registrations.map(r => r.school))).sort();
    const classes = Array.from(new Set(registrations.map(r => r.className))).sort();
    return { zones, schools, classes };
  }, [registrations]);

  // Data Aggregation
  const stats = useMemo(() => {
    const today = new Date();
    const todayCount = registrations.filter(r => {
      if (!r.createdAt) return false;
      const date = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    }).length;

    const males = registrations.filter(r => r.gender.toLowerCase() === 'male' || r.gender.toLowerCase() === 'boy').length;
    const females = registrations.filter(r => r.gender.toLowerCase() === 'female' || r.gender.toLowerCase() === 'girl').length;

    return {
      total: registrations.length,
      withParent: registrations.filter(r => r.withParent).length,
      uniqueSchools: new Set(registrations.map(r => r.school)).size,
      uniqueZones: new Set(registrations.map(r => r.zone)).size,
      todayCount,
      males,
      females,
    };
  }, [registrations]);

  const aggregatedData = useMemo(() => {
    // Gender
    const genderMap = registrations.reduce((acc: any, r) => {
      acc[r.gender] = (acc[r.gender] || 0) + 1;
      return acc;
    }, {});
    const genderData = Object.keys(genderMap).map(key => ({ name: key, value: genderMap[key] }));

    // Zone
    const zoneMap = registrations.reduce((acc: any, r) => {
      acc[r.zone] = (acc[r.zone] || 0) + 1;
      return acc;
    }, {});
    const zoneData = Object.keys(zoneMap).map(key => ({ zone: key, count: zoneMap[key] }));

    // Accompaniment
    const accompanimentData = [
      { name: 'Accompanied', value: registrations.filter(r => r.withParent).length },
      { name: 'Individual', value: registrations.filter(r => !r.withParent).length },
    ];

    // Relation
    const relationMap = registrations.filter(r => r.withParent).reduce((acc: any, r) => {
      const rel = r.relation || 'Other';
      acc[rel] = (acc[rel] || 0) + 1;
      return acc;
    }, {});
    const relationData = Object.keys(relationMap).map(key => ({ relation: key, count: relationMap[key] }));

    return { genderData, zoneData, accompanimentData, relationData };
  }, [registrations]);

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  const filteredData = useMemo(() => registrations.map(r => ({
    ...r,
    schoolName: getSchoolName(r.school)
  })).filter(r => {
    const searchLow = searchTerm.toLowerCase();
    const studentNameSafe = r.studentName ? r.studentName.toLowerCase() : "";
    const schoolNameSafe = r.schoolName ? r.schoolName.toLowerCase() : "";
    const zoneSafe = r.zone ? r.zone.toLowerCase() : "";

    const matchesSearch = studentNameSafe.includes(searchLow) ||
      schoolNameSafe.includes(searchLow) ||
      zoneSafe.includes(searchLow);

    const matchesZone = filterZone === "all" || r.zone === filterZone;
    const matchesSchool = filterSchool === "all" || r.school === filterSchool;
    const matchesClass = filterClass === "all" || r.className === filterClass;
    const matchesGender = filterGender === "all" || (r.gender && r.gender.toUpperCase() === filterGender.toUpperCase());

    let matchesAccompaniment = true;
    if (filterAccompaniment === "accompanied") matchesAccompaniment = r.withParent === true;
    if (filterAccompaniment === "individual") matchesAccompaniment = r.withParent === false;

    return matchesSearch && matchesZone && matchesSchool && matchesClass && matchesGender && matchesAccompaniment;
  }), [registrations, searchTerm, filterZone, filterSchool, filterClass, filterGender, filterAccompaniment]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilterZone("all");
    setFilterSchool("all");
    setFilterClass("all");
    setFilterGender("all");
    setFilterAccompaniment("all");
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  if (authLoading || loading || !hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-figtree">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black tracking-widest uppercase text-slate-400">Restoring Experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 flex font-figtree font-normal">
      <DashboardSidebar
        sidebarOpen={true}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
      />

      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        {/* Top Professional Header */}
        <header className="bg-white/70 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4 lg:gap-0 border-b border-slate-100">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="md:hidden">
              <img src="/yeslogo.png" alt="Logo" className="h-8 w-auto" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-normal text-slate-900 leading-none">Dashboard Overview</h1>
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
                <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] text-white font-black animate-pulse">1</span>
              </div>
            </div>

            {/* User Profile Area */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[13px] font-black text-slate-900 leading-none">Administrator</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Administrator</div>
              </div>
              <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Admin`} />
                <AvatarFallback className="bg-indigo-600 text-white font-black text-xs">AD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-10 max-w-[1600px] w-full mx-auto flex flex-col min-h-[calc(100vh-80px)]">
          <div className="flex-grow">
            {activeTab === 'overview' && (
              <>
                <AnalyticsSummary stats={stats} />

                {/* Context & Granular Filters Area */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-xl font-normal text-slate-900 tracking-tight">Analytical Insights</h2>
                    <p className="text-[10px] font-normal text-slate-500 uppercase mt-1">Cross-filtered database metrics</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  </div>
                </div>

                <PerformanceCharts
                  genderData={aggregatedData.genderData}
                  zoneData={aggregatedData.zoneData}
                  accompanimentData={aggregatedData.accompanimentData}
                  relationData={aggregatedData.relationData}
                />
              </>
            )}

            {(activeTab === 'overview' || activeTab === 'records') && (
              <div className="mt-4">
                <StudentDataTable
                  filteredData={filteredData}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  itemsPerPage={activeTab === 'overview' ? 10 : 20}
                  filterZone={filterZone}
                  setFilterZone={setFilterZone}
                  filterClass={filterClass}
                  setFilterClass={setFilterClass}
                  filterSchool={filterSchool}
                  setFilterSchool={setFilterSchool}
                  filterGender={filterGender}
                  setFilterGender={setFilterGender}
                  filterAccompaniment={filterAccompaniment}
                  setFilterAccompaniment={setFilterAccompaniment}
                  filterOptions={filterOptions}
                  resetFilters={resetFilters}
                />
              </div>
            )}

            {activeTab === 'accompaniments' && (
              <div className="mt-4">
                <AccompanimentDataTable
                  filteredData={filteredData}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  itemsPerPage={20}
                  filterZone={filterZone}
                  setFilterZone={setFilterZone}
                  filterClass={filterClass}
                  setFilterClass={setFilterClass}
                  filterSchool={filterSchool}
                  setFilterSchool={setFilterSchool}
                  filterGender={filterGender}
                  setFilterGender={setFilterGender}
                  filterAccompaniment={filterAccompaniment}
                  setFilterAccompaniment={setFilterAccompaniment}
                  filterOptions={filterOptions}
                  resetFilters={resetFilters}
                />
              </div>
            )}

            {activeTab === 'export' && (
              <ExportCenter registrations={registrations} />
            )}

            {activeTab === 'pass' && (
              <AccessPassCenter registrations={registrations} />
            )}
          </div>

          <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 font-normal uppercase tracking-widest gap-4">
            <div>&copy; {hasMounted ? new Date().getFullYear() : '2026'} YES INDIA FOUNDATION. ALL RIGHTS RESERVED.</div>
            <div>DESIGNED AND DEVELOPED BY CYBERDUCE</div>
          </footer>
        </main>
      </div>
    </div>
  );
}
