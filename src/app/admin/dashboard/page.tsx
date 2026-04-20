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
import { GuestDataTable } from "./components/GuestDataTable";
import { YesianDataTable } from "./components/YesianDataTable";
import { ExportCenter } from "./components/ExportCenter";
import RegistrationSettings from "./components/RegistrationSettings";

import { Registration, GuestRegistration, YesianRegistration, DashboardStats } from "./types";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [guestRegistrations, setGuestRegistrations] = useState<GuestRegistration[]>([]);
  const [yesianRegistrations, setYesianRegistrations] = useState<YesianRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestLoading, setGuestLoading] = useState(true);
  const [yesianLoading, setYesianLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [filterAccompaniment, setFilterAccompaniment] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const router = useRouter();

  // Reset scroll when tab changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    setHasMounted(true);
    if (!user) return;

    // Students
    const qStudents = query(collection(db, "registrations"), orderBy("createdAt", "desc"));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Registration[];
      setRegistrations(docs);
      setLoading(false);
      setLastSync(new Date().toLocaleTimeString());
    });

    // Guests
    const qGuests = query(collection(db, "guest_registrations"), orderBy("createdAt", "desc"));
    const unsubscribeGuests = onSnapshot(qGuests, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GuestRegistration[];
      setGuestRegistrations(docs);
      setGuestLoading(false);
      setLastSync(new Date().toLocaleTimeString());
    });

    // Yesians
    const qYesians = query(collection(db, "yesian_registrations"), orderBy("createdAt", "desc"));
    const unsubscribeYesians = onSnapshot(qYesians, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as YesianRegistration[];
      setYesianRegistrations(docs);
      setGuestLoading(false);
      setLastSync(new Date().toLocaleTimeString());
    });

    return () => {
      unsubscribeStudents();
      unsubscribeGuests();
      unsubscribeYesians();
    };
  }, [user]);

  // Derived filter options
  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(registrations.map(r => r.zone))).sort();
    const schools = Array.from(new Set(registrations.map(r => r.school))).sort();
    const classes = Array.from(new Set(registrations.map(r => r.className))).sort();
    return { zones, schools, classes };
  }, [registrations]);

  // Data Aggregation
  const stats: DashboardStats = useMemo(() => {
    const today = new Date();
    const todayCount = registrations.filter(r => {
      if (!r.createdAt) return false;
      const date = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
    }).length;

    // Aggregate Gender from all sources
    const studentMales = registrations.filter(r => r.gender?.toLowerCase() === "male").length;
    const studentFemales = registrations.filter(r => r.gender?.toLowerCase() === "female").length;
    
    const guestMales = guestRegistrations.filter(r => r.gender?.toLowerCase() === "male").length;
    const guestFemales = guestRegistrations.filter(r => r.gender?.toLowerCase() === "female").length;
    
    const yesianMales = yesianRegistrations.filter(r => r.gender?.toLowerCase() === "male").length;
    const yesianFemales = yesianRegistrations.filter(r => r.gender?.toLowerCase() === "female").length;

    const malesCount = studentMales + guestMales + yesianMales;
    const femalesCount = studentFemales + guestFemales + yesianFemales;

    const totalSchools = new Set(registrations.map(r => r.school)).size;
    const totalZones = new Set(registrations.map(r => r.zone)).size;

    // Available totals from master data
    const availableZonesCount = locations.length;
    const availableSchoolsCount = locations.reduce((acc, zone) => acc + zone.schools.length, 0);

    // Trend Data Logic (Last 7 Days)
    const allDocs = [...registrations, ...guestRegistrations, ...yesianRegistrations];
    const trendMap = new Map();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }).reverse();

    last7Days.forEach(date => trendMap.set(date, 0));
    allDocs.forEach(doc => {
      if (!doc.createdAt) return;
      const date = (doc.createdAt.toDate ? doc.createdAt.toDate() : new Date(doc.createdAt))
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (trendMap.has(date)) {
        trendMap.set(date, trendMap.get(date) + 1);
      }
    });

    const trendData = last7Days.map(date => ({ date, count: trendMap.get(date) }));

    const platformData = [
      { name: 'Students', value: registrations.length },
      { name: 'Guests', value: guestRegistrations.length },
      { name: 'Yesians', value: yesianRegistrations.length },
    ];

    return {
      totalStudents: registrations.length,
      totalGuests: guestRegistrations.length,
      totalYesians: yesianRegistrations.length,
      todayCount,
      totalParticipation: registrations.length + guestRegistrations.length + yesianRegistrations.length,
      totalAccompanied: registrations.filter(r => r.withParent).length,
      totalSchools,
      totalZones,
      availableSchoolsCount,
      availableZonesCount,
      malesCount,
      femalesCount,
      lastUpdated: lastSync,
      trendData,
      platformData,
    };
  }, [registrations, guestRegistrations, yesianRegistrations]);

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

  const filteredGuests = useMemo(() => guestRegistrations.filter(r => {
    const searchLow = searchTerm.toLowerCase();
    return (r.name?.toLowerCase() || "").includes(searchLow) ||
      (r.whatsappNumber || "").includes(searchLow) ||
      (r.address?.toLowerCase() || "").includes(searchLow);
  }), [guestRegistrations, searchTerm]);

  const filteredYesians = useMemo(() => yesianRegistrations.filter(r => {
    const searchLow = searchTerm.toLowerCase();
    return (r.name?.toLowerCase() || "").includes(searchLow) ||
      (r.whatsappNumber || "").includes(searchLow) ||
      (r.zone?.toLowerCase() || "").includes(searchLow) ||
      (r.designation?.toLowerCase() || "").includes(searchLow);
  }), [yesianRegistrations, searchTerm]);

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
          <p className="text-xs font-normal tracking-widest uppercase text-slate-400">Restoring Experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 flex font-figtree font-normal">
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSignOut={handleSignOut}
      />

      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        {/* Top Professional Header */}
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
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "records" && "Student Management"}
                {activeTab === "accompaniments" && "Guardian Database"}
                {activeTab === "guests" && "Guest Registry"}
                {activeTab === "yesians" && "Yesian Network"}
                {activeTab === "pass" && "Access Pass Center"}
                {activeTab === "export" && "Master Export Center"}
                {activeTab === "settings" && "Portal Configuration"}
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

            {/* User Profile Area */}
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
                  stats={stats}
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

            {activeTab === 'guests' && (
              <div className="mt-4">
                <GuestDataTable
                  data={filteredGuests}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  itemsPerPage={20}
                />
              </div>
            )}

            {activeTab === 'yesians' && (
              <div className="mt-4">
                <YesianDataTable
                  data={filteredYesians}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  itemsPerPage={20}
                />
              </div>
            )}

            {activeTab === 'export' && (
              <ExportCenter 
                registrations={registrations} 
                guestRegistrations={guestRegistrations}
                yesianRegistrations={yesianRegistrations}
              />
            )}

            {activeTab === 'pass' && (
              <AccessPassCenter 
                registrations={registrations} 
                guestRegistrations={guestRegistrations}
                yesianRegistrations={yesianRegistrations}
              />
            )}

            {activeTab === 'settings' && (
              <RegistrationSettings />
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
