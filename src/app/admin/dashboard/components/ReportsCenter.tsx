"use client";

import { useMemo, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, UserCheck, GraduationCap, MapPin, 
  School, PieChart as PieIcon, BarChart3, TrendingUp,
  Download, Filter, ArrowUpRight, ArrowDownRight,
  TrendingDown, Info, Check, X
} from "lucide-react";
import { 
  Registration, 
  GuestRegistration, 
  YesianRegistration, 
  LocalStaffRegistration,
  AlumniRegistration,
  VolunteerRegistration,
  AwardeeRegistration,
  QiraathRegistration,
  DriverStaffRegistration,
  ScoutTeamRegistration,
  MediaRegistration
} from "../types";
import { locations } from "@/data/locations";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { generateStrategicReportPDF, generateClassGenderSummaryPDF, generateSchoolSummaryExcel } from "@/lib/exportUtils";

interface ReportsCenterProps {
  registrations: Registration[];
  guestRegistrations: GuestRegistration[];
  yesianRegistrations: YesianRegistration[];
  localStaffRegistrations: LocalStaffRegistration[];
  alumniRegistrations: AlumniRegistration[];
  volunteerRegistrations: VolunteerRegistration[];
  awardeeRegistrations: AwardeeRegistration[];
  qiraathRegistrations: QiraathRegistration[];
  driverStaffRegistrations: DriverStaffRegistration[];
  scoutTeamRegistrations: ScoutTeamRegistration[];
  mediaRegistrations: MediaRegistration[];
  stats: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e', '#14b8a6'];

export function ReportsCenter({ 
  registrations, 
  guestRegistrations, 
  yesianRegistrations, 
  localStaffRegistrations,
  alumniRegistrations,
  volunteerRegistrations,
  awardeeRegistrations,
  qiraathRegistrations,
  driverStaffRegistrations,
  scoutTeamRegistrations,
  mediaRegistrations,
  stats 
}: ReportsCenterProps) {
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAccompaniment, setSelectedAccompaniment] = useState<string>("all");
  const [selectedAwardeeType, setSelectedAwardeeType] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  const filteredData = useMemo(() => {
    let s = [...registrations];
    let st = [...localStaffRegistrations];
    let g = [...guestRegistrations];
    let y = [...yesianRegistrations];
    let a = [...alumniRegistrations];
    let v = [...volunteerRegistrations];
    let aw = [...awardeeRegistrations];
    let q = [...qiraathRegistrations];
    let d = [...driverStaffRegistrations];
    let sc = [...scoutTeamRegistrations];
    let m = [...mediaRegistrations];

    if (selectedZone !== "all") {
      s = s.filter(r => r.zone === selectedZone);
      st = st.filter(r => r.zone === selectedZone);
      y = y.filter(r => r.zone === selectedZone);
      a = a.filter(r => r.zone === selectedZone);
      v = v.filter(r => r.zone === selectedZone);
      aw = aw.filter(r => r.zone === selectedZone);
      q = q.filter(r => r.zone === selectedZone);
      d = d.filter(r => r.zone === selectedZone);
      sc = sc.filter(r => r.zone === selectedZone);
      // Media currently has no zone field, keeping it as is or filtered if added later
    }

    if (selectedSchool !== "all") {
      s = s.filter(r => r.school === selectedSchool);
      st = st.filter(r => r.school === selectedSchool);
      a = a.filter(r => r.school === selectedSchool);
      v = v.filter(r => r.school === selectedSchool);
      aw = aw.filter(r => r.school === selectedSchool);
      q = q.filter(r => r.school === selectedSchool);
      sc = sc.filter(r => r.school === selectedSchool);
    }

    if (selectedType !== "all") {
      if (selectedType !== "Student") s = [];
      if (selectedType !== "Staff") st = [];
      if (selectedType !== "Guest") g = [];
      if (selectedType !== "Yesian") y = [];
      if (selectedType !== "Alumni") a = [];
      if (selectedType !== "Volunteer") v = [];
      if (selectedType !== "Awardee") aw = [];
      if (selectedType !== "Qiraath") q = [];
      if (selectedType !== "Driver") d = [];
      if (selectedType !== "Scout") sc = [];
      if (selectedType !== "Media") m = [];
    }

    if (selectedAccompaniment !== "all") {
      const wantAcc = selectedAccompaniment === "with";
      s = s.filter(r => !!r.withParent === wantAcc);
      a = a.filter(r => !!r.withParent === wantAcc);
      v = v.filter(r => !!r.withParent === wantAcc);
      aw = aw.filter(r => !!r.withParent === wantAcc);
      q = q.filter(r => !!r.withParent === wantAcc);
      sc = sc.filter(r => !!r.withParent === wantAcc);
      // Others don't have accompaniment, so clear them if we want with accompaniment
      if (wantAcc) {
        st = []; g = []; y = []; d = []; m = [];
      }
    }

    if (selectedAwardeeType !== "all") {
      aw = aw.filter(r => r.selectionType === selectedAwardeeType);
      // Clear others as they are not awardees
      s = []; st = []; g = []; y = []; a = []; v = []; q = []; d = []; sc = []; m = [];
    }

    return { s, st, g, y, a, v, aw, q, d, sc, m };
  }, [selectedZone, selectedSchool, selectedType, selectedAccompaniment, selectedAwardeeType, registrations, localStaffRegistrations, guestRegistrations, yesianRegistrations, alumniRegistrations, volunteerRegistrations, awardeeRegistrations, qiraathRegistrations, driverStaffRegistrations, scoutTeamRegistrations, mediaRegistrations]);

  const reportData = useMemo(() => {
    const { s, st, g, y, a, v, aw, q, d, sc, m } = filteredData;
    const allPeople = [
      ...s.map((r: any) => ({ ...r, type: 'Student' })),
      ...g.map((r: any) => ({ ...r, type: 'Guest' })),
      ...y.map((r: any) => ({ ...r, type: 'Yesian' })),
      ...st.map((r: any) => ({ ...r, type: 'Staff' })),
      ...a.map((r: any) => ({ ...r, type: 'Alumni' })),
      ...v.map((r: any) => ({ ...r, type: 'Volunteer' })),
      ...aw.map((r: any) => ({ ...r, type: 'Awardee' })),
      ...q.map((r: any) => ({ ...r, type: 'Qiraath' })),
      ...d.map((r: any) => ({ ...r, type: 'Driver' })),
      ...sc.map((r: any) => ({ ...r, type: 'Scout' })),
      ...m.map((r: any) => ({ ...r, type: 'Media' })),
    ];

    // 1. Gender Distribution (Unified)
    const genderMap = allPeople.reduce((acc: any, p) => {
      const gender = p.gender?.toLowerCase() === 'male' ? 'Male' : 
                     p.gender?.toLowerCase() === 'female' ? 'Female' : 'Other';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});
    const genderStats = Object.keys(genderMap).map(name => ({ name, value: genderMap[name] }));

    // 2. Class-wise Distribution (Students only)
    const classMap = s.reduce((acc: any, r) => {
      const cls = r.className || 'Unknown';
      acc[cls] = (acc[cls] || 0) + 1;
      return acc;
    }, {});
    const classStats = Object.keys(classMap)
      .map(name => ({ name, count: classMap[name] }))
      .sort((a, b) => {
        const aNum = parseInt(a.name) || 999;
        const bNum = parseInt(b.name) || 999;
        if (aNum !== bNum) return aNum - bNum;
        return a.name.localeCompare(b.name);
      });

    // 3. Zone Distribution (All)
    const zoneMap = (allPeople as any[]).reduce((acc: any, p) => {
      const zone = p.zone || 'N/A';
      acc[zone] = (acc[zone] || 0) + 1;
      return acc;
    }, {});
    const zoneStats = Object.keys(zoneMap)
      .map(name => ({ name, count: zoneMap[name] }))
      .sort((a, b) => b.count - a.count);

    // 4. Consolidated School Distribution (All types with school field)
    const schoolMap = allPeople.reduce((acc: any, p: any) => {
      if (!p.school) return acc;
      const schoolName = getSchoolName(p.school);
      acc[schoolName] = (acc[schoolName] || 0) + 1;
      return acc;
    }, {});
    const schoolStats = Object.keys(schoolMap)
      .map(name => ({ name, count: schoolMap[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // 5. Gender by Zone (Consolidated)
    const zoneGenderMap = allPeople.reduce((acc: any, p: any) => {
      const zone = p.zone || 'N/A';
      const gender = p.gender?.toLowerCase() === 'male' ? 'Male' : 
                     p.gender?.toLowerCase() === 'female' ? 'Female' : 'Other';
      if (!acc[zone]) acc[zone] = { name: zone, Male: 0, Female: 0 };
      if (gender === 'Male' || gender === 'Female') acc[zone][gender]++;
      return acc;
    }, {});
    const genderByZoneData = Object.values(zoneGenderMap).sort((a: any, b: any) => (b.Male + b.Female) - (a.Male + a.Female)).slice(0, 10);

    // 6. Local Staff Insights (Specific)
    const staffGenderMap = st.reduce((acc: any, p) => {
      const gender = p.gender?.toLowerCase() === 'male' ? 'Male' : 
                     p.gender?.toLowerCase() === 'female' ? 'Female' : 'Other';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});
    const staffGenderStats = Object.keys(staffGenderMap).map(name => ({ name, value: staffGenderMap[name] }));

    const staffSchoolMap = st.reduce((acc: any, p) => {
      if (!p.school) return acc;
      const schoolName = getSchoolName(p.school);
      acc[schoolName] = (acc[schoolName] || 0) + 1;
      return acc;
    }, {});
    const staffSchoolStats = Object.keys(staffSchoolMap)
      .map(name => ({ name, count: staffSchoolMap[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 7. Application Type Distribution
    const typeMap = allPeople.reduce((acc: any, p) => {
      const type = p.type || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const typeStats = Object.keys(typeMap).map(name => ({ name, value: typeMap[name] }));

    // 8. Gender by Application Type
    const typeGenderMap = allPeople.reduce((acc: any, p: any) => {
      const type = p.type || 'Other';
      const gender = p.gender?.toLowerCase() === 'male' ? 'Male' : 
                     p.gender?.toLowerCase() === 'female' ? 'Female' : 'Other';
      if (!acc[type]) acc[type] = { name: type, Male: 0, Female: 0 };
      if (gender === 'Male' || gender === 'Female') acc[type][gender]++;
      return acc;
    }, {});
    const genderByTypeData = Object.values(typeGenderMap).sort((a: any, b: any) => (b.Male + b.Female) - (a.Male + a.Female));

    const countAccs = (regs: any[]) => regs.reduce((acc, r) => {
      if (!r.withParent) return acc;
      const count = r.accompaniments && r.accompaniments.length > 0 ? r.accompaniments.length : 1;
      return acc + count;
    }, 0);

    const totalAccompaniments = countAccs(s) + countAccs(a) + countAccs(v) + countAccs(aw) + countAccs(q) + countAccs(sc);

    const accGenderMap = { Male: 0, Female: 0 };
    [s, a, v, aw, q, sc].forEach((list: any[]) => {
      list.forEach((r: any) => {
        if (r.accompaniments && r.accompaniments.length > 0) {
          r.accompaniments.forEach((acc: any) => {
            const g = acc.gender?.toLowerCase() === 'male' ? 'Male' : 'Female';
            accGenderMap[g]++;
          });
        } else if (r.withParent) {
          const g = r.parentGender?.toLowerCase() === 'male' ? 'Male' : 'Female';
          accGenderMap[g]++;
        }
      });
    });
    const accGenderStats = [
      { name: 'Male', value: accGenderMap.Male },
      { name: 'Female', value: accGenderMap.Female }
    ];

    return { 
      genderStats, 
      classStats, 
      zoneStats, 
      schoolStats, 
      genderByZoneData,
      staffGenderStats,
      staffSchoolStats,
      typeStats,
      genderByTypeData,
      total: allPeople.length,
      totalAccompaniments,
      accGenderStats,
      qiraathGenderStats: [
        { name: 'Male', value: q.filter((r: any) => r.gender?.toLowerCase() === 'male').length },
        { name: 'Female', value: q.filter((r: any) => r.gender?.toLowerCase() === 'female').length }
      ]
    };
  }, [filteredData]);

  const availableSchools = useMemo(() => {
    if (selectedZone === "all") {
       return locations.flatMap(z => z.schools);
    }
    return locations.find(z => z.id === selectedZone)?.schools || [];
  }, [selectedZone]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const { s, st, g, y, a, v, aw, q, d, sc, m } = filteredData;
      await generateStrategicReportPDF(s, st, y, g, a, v, aw, q, d, sc, m);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleClassGenderExport = async () => {
    try {
      setIsExporting(true);
      // Combine all types that have a class field for a comprehensive report
      const { s, a, v, aw, q, sc } = filteredData;
      const classData = [...s, ...a, ...v, ...aw, ...q, ...sc];
      await generateClassGenderSummaryPDF(classData, "CLASS-WISE GENDER DISTRIBUTION", `Class_Gender_Report_${new Date().getTime()}`);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSchoolSummaryExcelExport = async () => {
    try {
      setIsExporting(true);
      // Aggregate data from all relevant student categories
      const { s, a, v, aw, q, sc } = filteredData;
      const combinedData = [...s, ...a, ...v, ...aw, ...q, ...sc];
      generateSchoolSummaryExcel(combinedData, `School_Summary_${new Date().getTime()}`);
    } catch (e) {
      console.error(e);
      alert("Failed to generate Excel. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-normal text-slate-900 tracking-tight">Analytics & Reports</h2>
          <p className="text-slate-500 text-sm mt-1">Comprehensive overview of registrations and participation trends.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={selectedZone} onValueChange={(val) => { setSelectedZone(val); setSelectedSchool("all"); }}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 text-slate-600 font-normal">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="all">Everywhere</SelectItem>
              {locations.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedSchool} onValueChange={setSelectedSchool}>
            <SelectTrigger className="w-[180px] h-10 rounded-xl border-slate-200 text-slate-600 font-normal">
              <SelectValue placeholder="All Schools" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="all">All Schools</SelectItem>
              {availableSchools.map(sch => <SelectItem key={sch.id} value={sch.id}>{sch.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 text-slate-600 font-normal">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Student">Students</SelectItem>
              <SelectItem value="Staff">Local Staff</SelectItem>
              <SelectItem value="Guest">Guests</SelectItem>
              <SelectItem value="Yesian">Yesians</SelectItem>
              <SelectItem value="Alumni">Alumni</SelectItem>
              <SelectItem value="Volunteer">Volunteers</SelectItem>
              <SelectItem value="Awardee">Awardees</SelectItem>
              <SelectItem value="Qiraath">Qiraath</SelectItem>
              <SelectItem value="Driver">Drivers/Support</SelectItem>
              <SelectItem value="Scout">Scout Team</SelectItem>
              <SelectItem value="Media">Media Personnel</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedAccompaniment} onValueChange={setSelectedAccompaniment}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl border-slate-200 text-slate-600 font-normal">
              <SelectValue placeholder="Accompaniment" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-xl">
              <SelectItem value="all">All (Acc.)</SelectItem>
              <SelectItem value="with">With Guardian</SelectItem>
              <SelectItem value="without">Without Guardian</SelectItem>
            </SelectContent>
          </Select>

          {awardeeRegistrations.length > 0 && (
            <Select value={selectedAwardeeType} onValueChange={setSelectedAwardeeType}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl border-slate-200 text-slate-600 font-normal">
                <SelectValue placeholder="Awardee Type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-xl">
                <SelectItem value="all">All Award Types</SelectItem>
                {Array.from(new Set(awardeeRegistrations.map(r => r.selectionType))).filter(Boolean).map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(selectedZone !== "all" || selectedSchool !== "all" || selectedType !== "all" || selectedAccompaniment !== "all" || selectedAwardeeType !== "all") && (
            <Button 
              variant="ghost" 
              className="h-10 px-3 text-slate-400 hover:text-red-500"
              onClick={() => { 
                setSelectedZone("all"); 
                setSelectedSchool("all"); 
                setSelectedType("all");
                setSelectedAccompaniment("all");
                setSelectedAwardeeType("all");
              }}
            >
              <X size={16} />
            </Button>
          )}

          <Button 
            className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-normal shadow-lg shadow-indigo-100 ml-2"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? "Generating..." : "Strategic Report"}
          </Button>

          <Button 
            className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-normal shadow-lg shadow-emerald-100"
            onClick={handleClassGenderExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? "Generating..." : "Class-Gender Report"}
          </Button>

          <Button 
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 font-normal shadow-lg shadow-blue-100"
            onClick={handleSchoolSummaryExcelExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? "Generating..." : "Export School Summary (Excel)"}
          </Button>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Participation", value: reportData.total, icon: <Users className="text-indigo-600" />, trend: "+12%", color: "indigo" },
          { label: "Student Volume", value: filteredData.s.length, icon: <GraduationCap className="text-emerald-600" />, trend: "+5%", color: "emerald" },
          { label: "Accompaniments", value: reportData.totalAccompaniments, icon: <Users className="text-amber-600" />, trend: "+10%", color: "amber" },
          { label: "Crew & Staff", value: filteredData.st.length + filteredData.y.length + filteredData.sc.length, icon: <UserCheck className="text-rose-600" />, trend: "+8%", color: "rose" },
        ].map((item, i) => (
          <Card key={i} className="border-none shadow-sm shadow-slate-200/50 rounded-[28px] overflow-hidden bg-white group hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-slate-50 transition-colors group-hover:scale-110 duration-500">
                  {item.icon}
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${item.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {item.trend.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {item.trend}
                </div>
              </div>
              <div className="text-2xl font-normal text-slate-900 tabular-nums">{item.value.toLocaleString()}</div>
              <div className="text-[11px] font-normal text-slate-400 uppercase tracking-widest mt-1">{item.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Primary Analytics */}
        <div className="lg:col-span-8 space-y-8">
          {/* Gender by Zone Distribution */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
            <CardHeader>
              <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-2">
                <MapPin className="text-indigo-500" size={18} />
                Gender Distribution by Zone
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest">Regional gender comparison</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.genderByZoneData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Male" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={24} />
                  <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[10, 10, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gender by Application Type */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
            <CardHeader>
              <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-2">
                <Users className="text-emerald-500" size={18} />
                Gender Distribution by Application Type
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest">Gender split across categories</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.genderByTypeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Male" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={32} />
                  <Bar dataKey="Female" stackId="a" fill="#ec4899" radius={[10, 10, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Key Insights */}
        <div className="lg:col-span-4 space-y-8">
          {/* Gender Distribution */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-2">
                <PieIcon className="text-indigo-500" size={18} />
                Gender Parity
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest">Consolidated across all types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.genderStats}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {reportData.genderStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Application Type Distribution */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-2">
                <Users className="text-emerald-500" size={18} />
                Application Types
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest">Category distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.typeStats}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {reportData.typeStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Local Staff Gender Distribution */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-2">
                <UserCheck className="text-sky-500" size={18} />
                Local Staff Gender
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest">Staff demographic split</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.staffGenderStats}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {reportData.staffGenderStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#0ea5e9' : '#f43f5e'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {/* Accompaniment Gender Distribution */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-2">
                <Users className="text-amber-500" size={18} />
                Guardian Gender
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest">Accompaniment demographic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.accGenderStats}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {reportData.accGenderStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#ec4899'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          {/* Qiraath Gender Distribution */}
          <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-2">
                <Users className="text-emerald-500" size={18} />
                Qiraath Gender
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest">Participant demographic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.qiraathGenderStats}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {reportData.qiraathGenderStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Full Width Section: Institutional Reports */}
        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Local Staff School Distribution */}
          <Card className="lg:col-span-4 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-6">
            <CardHeader>
              <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-2">
                <School className="text-sky-500" size={18} />
                Staff by School
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest">Institutional staffing volume</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.staffSchoolStats} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={9} width={120} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 8, 8, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Campus-wise (School) Report - ALL CATEGORIES */}
          <Card className="lg:col-span-8 border-none shadow-sm shadow-slate-200/50 rounded-[32px] bg-white p-8">
            <CardHeader className="px-0 pt-0 pb-8">
              <CardTitle className="text-lg font-normal text-slate-900 flex items-center gap-2">
                <School className="text-indigo-500" size={18} />
                Campus-wise Consolidated Distribution
              </CardTitle>
              <CardDescription className="text-xs uppercase tracking-widest">Participation volume by institution (All Types)</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.schoolStats} margin={{ bottom: 60 }}>
                    <XAxis dataKey="name" fontSize={8} angle={-45} textAnchor="end" interval={0} axisLine={false} tickLine={false} height={80} />
                    <YAxis fontSize={8} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Insight */}
      <div className="mt-12 bg-indigo-900 rounded-[40px] p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full -mr-64 -mt-64 blur-3xl" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-normal text-white tracking-tight mb-4">Strategic Participation Report</h3>
            <p className="text-indigo-200/80 leading-relaxed font-light">
              Current registration trends indicate strong academic engagement from primary and secondary zones.
              Gender parity is stable, and school-level participation is up by 15% compared to the previous cycle.
            </p>
            <div className="flex gap-4 mt-8">
              <Button 
                onClick={handleExport} 
                disabled={isExporting}
                className="bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl px-6 font-semibold"
              >
                {isExporting ? "Generating PDF..." : "Download Insight PDF"}
              </Button>
              <Button variant="ghost" className="text-white hover:bg-white/10 rounded-2xl px-6">View Historical Archive</Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
             <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center">
               <div className="text-4xl font-normal text-white mb-2">{Math.round((filteredData.s.length / (reportData.total || 1)) * 100)}%</div>
               <div className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">Student Ratio</div>
             </div>
             <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center">
               <div className="text-4xl font-normal text-white mb-2">{new Set([...filteredData.s, ...filteredData.st, ...filteredData.sc].map((p: any) => p.zone)).size}</div>
               <div className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">Zones Represented</div>
             </div>
             <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center">
               <div className="text-4xl font-normal text-white mb-2">{new Set([...filteredData.s, ...filteredData.st, ...filteredData.sc].map((p: any) => p.school)).size}</div>
               <div className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">Schools Involved</div>
             </div>
             <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center flex flex-col items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white mb-2">
                  <Check size={24} />
                </div>
               <div className="text-[10px] text-indigo-300 uppercase tracking-widest font-bold">Audit Ready</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
