"use client";

import { useState, useMemo } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { locations } from "@/data/locations";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CheckCircle2, RotateCcw, Clock, UserCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";

export default function AttendanceTrackPage() {
  const {
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
  } = useDashboardData();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const allAttended = useMemo(() => {
    const all = [
      ...registrations.map(r => ({ ...r, category: 'Student', label: r.studentName })),
      ...guestRegistrations.map(r => ({ ...r, category: 'Guest', label: r.name })),
      ...yesianRegistrations.map(r => ({ ...r, category: 'Yesian', label: r.name })),
      ...localStaffRegistrations.map(r => ({ ...r, category: 'Local Staff', label: r.name })),
      ...alumniRegistrations.map(r => ({ ...r, category: 'Alumni', label: r.name })),
      ...volunteerRegistrations.map(r => ({ ...r, category: 'Volunteer', label: r.volunteerName })),
      ...awardeeRegistrations.map(r => ({ ...r, category: 'Awardee', label: r.name })),
      ...qiraathRegistrations.map(r => ({ ...r, category: 'Qiraath', label: r.name })),
      ...driverStaffRegistrations.map(r => ({ ...r, category: 'Driver/Staff', label: r.name })),
      ...scoutTeamRegistrations.map(r => ({ ...r, category: 'Scout Team', label: r.name })),
    ];

    return all.filter(r => r.attendance === true);
  }, [
    registrations, guestRegistrations, yesianRegistrations, localStaffRegistrations,
    alumniRegistrations, volunteerRegistrations, awardeeRegistrations, qiraathRegistrations,
    driverStaffRegistrations, scoutTeamRegistrations
  ]);

  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(allAttended.map((r: any) => r.zone))).filter(Boolean).sort();
    const schools = Array.from(new Set(allAttended.map((r: any) => r.school || r.schoolName))).filter(Boolean).sort();
    const classes = Array.from(new Set(allAttended.map((r: any) => r.className))).filter(Boolean).sort();
    const types = Array.from(new Set(allAttended.map((r: any) => r.category))).filter(Boolean).sort();
    return { zones, schools, classes, types };
  }, [allAttended]);

  const attendedRecords = useMemo(() => {
    let filtered = [...allAttended];

    if (filterType !== "all") {
      filtered = filtered.filter(r => r.category === filterType);
    }
    if (filterZone !== "all") {
      filtered = filtered.filter((r: any) => r.zone === filterZone);
    }
    if (filterSchool !== "all") {
      filtered = filtered.filter((r: any) => r.school === filterSchool || r.schoolName === filterSchool);
    }
    if (filterClass !== "all") {
      filtered = filtered.filter((r: any) => r.className === filterClass);
    }
    if (filterGender !== "all") {
      filtered = filtered.filter((r: any) => r.gender?.toLowerCase() === filterGender.toLowerCase());
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((r: any) => 
        (r.label?.toLowerCase() || "").includes(lower) || 
        (r.category?.toLowerCase() || "").includes(lower) ||
        (r.id?.toLowerCase() || "").includes(lower) ||
        (r.whatsappNumber?.toLowerCase() || "").includes(lower) ||
        (r.mobileNumber?.toLowerCase() || "").includes(lower)
      );
    }

    // Sort by attendedAt desc
    filtered.sort((a: any, b: any) => {
      const timeA = a.attendedAt?.toDate ? a.attendedAt.toDate().getTime() : new Date(a.attendedAt || 0).getTime();
      const timeB = b.attendedAt?.toDate ? b.attendedAt.toDate().getTime() : new Date(b.attendedAt || 0).getTime();
      return timeB - timeA;
    });

    return filtered;
  }, [allAttended, searchTerm, filterType, filterZone, filterSchool, filterClass, filterGender]);

  const stats = useMemo(() => {
    const getCount = (cat: string) => allAttended.filter(r => r.category === cat).length;
    return {
      total: allAttended.length,
      student: getCount('Student'),
      guest: getCount('Guest'),
      volunteer: getCount('Volunteer'),
      awardee: getCount('Awardee'),
      scout: getCount('Scout Team'),
      staff: getCount('Local Staff'),
      alumni: getCount('Alumni'),
      yesian: getCount('Yesian'),
      qiraath: getCount('Qiraath'),
      driver: getCount('Driver/Staff')
    };
  }, [allAttended]);

  const getSchoolName = (schoolId: string) => {
    if (!schoolId) return "-";
    for (const zone of locations) {
      const school = zone.schools.find((s) => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  const totalPages = Math.ceil(attendedRecords.length / itemsPerPage);
  const displayData = attendedRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "N/A";
    let date: Date;
    if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      day: "2-digit",
      month: "short"
    }).format(date);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Total</p>
              <h3 className="text-lg font-bold text-slate-900">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Delegates</p>
              <h3 className="text-lg font-bold text-slate-900">{stats.student}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Guests</p>
              <h3 className="text-lg font-bold text-slate-900">{stats.guest}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Volunteers</p>
              <h3 className="text-lg font-bold text-slate-900">{stats.volunteer}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Awardees</p>
              <h3 className="text-lg font-bold text-slate-900">{stats.awardee}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Scout Team</p>
              <h3 className="text-lg font-bold text-slate-900">{stats.scout}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Local Staff</p>
              <h3 className="text-lg font-bold text-slate-900">{stats.staff}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Yesians</p>
              <h3 className="text-lg font-bold text-slate-900">{stats.yesian}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Drivers/Support</p>
              <h3 className="text-lg font-bold text-slate-900">{stats.driver}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="main-content border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="bg-white p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 bg-slate-50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-slate-200 w-full text-xs"
              />
            </div>

            <Select value={filterType} onValueChange={(v) => { setFilterType(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 bg-slate-50 border-none text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filterOptions.types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterZone} onValueChange={(v) => { setFilterZone(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 bg-slate-50 border-none text-xs">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {filterOptions.zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterSchool} onValueChange={(v) => { setFilterSchool(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 bg-slate-50 border-none text-xs">
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {filterOptions.schools.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 bg-slate-50 border-none text-xs">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {filterOptions.classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterGender} onValueChange={(v) => { setFilterGender(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 bg-slate-50 border-none text-xs">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 mt-4 xl:mt-0">
            {(searchTerm !== "" || filterType !== "all" || filterZone !== "all" || filterSchool !== "all" || filterClass !== "all" || filterGender !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterZone("all");
                  setFilterSchool("all");
                  setFilterClass("all");
                  setFilterGender("all");
                  setCurrentPage(1);
                }}
                className="h-8 px-2 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5"
              >
                <RotateCcw size={12} />
                Reset
              </Button>
            )}
            <Button
              onClick={() => {
                import("@/lib/exportUtils").then(m => {
                  m.generateAttendancePDF(attendedRecords, "Attendance Report", "attendance_report");
                });
              }}
              className="h-9 px-3 text-[10px] uppercase tracking-widest font-bold bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all rounded-xl shadow-sm"
            >
              <Download size={14} className="mr-2" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-50">
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest pl-6">
                    Name
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                    Category
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                    ID Prefix
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                    Zone
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">
                    School/Details
                  </TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest text-right pr-6">
                    Check-in Time
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((reg: any) => (
                  <TableRow key={reg.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-slate-100 shrink-0">
                          <AvatarImage src={reg.photoUrl} alt={reg.label} className="object-cover" />
                          <AvatarFallback className="bg-slate-50 text-slate-400">
                            <User size={16} />
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-normal text-sm text-slate-900">
                          {reg.label}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-none">
                        {reg.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                        {reg.id?.substring(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs text-slate-600 font-medium">{(reg as any).zone || "-"}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-xs text-slate-500 truncate max-w-[200px] inline-block" title={(reg as any).category === 'Yesian' ? (reg as any).designation : ((reg as any).school || (reg as any).schoolName)}>
                        {reg.category === 'Yesian' 
                          ? ((reg as any).designation || "-") 
                          : (getSchoolName((reg as any).school) !== (reg as any).school 
                              ? getSchoolName((reg as any).school) 
                              : ((reg as any).schoolName || (reg as any).designation || (reg as any).address || (reg as any).school || "-"))
                        }
                      </span>
                    </TableCell>
                    <TableCell className="py-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock size={12} className="text-emerald-500" />
                        <span className="text-[11px] font-bold text-slate-600 tracking-wide">
                          {formatTime(reg.attendedAt)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {attendedRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <div className="bg-slate-50/20 p-4 border-t border-slate-50 flex justify-between items-center">
            <div className="text-[10px] text-slate-400 font-normal uppercase tracking-widest px-2">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, attendedRecords.length)} of {attendedRecords.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 text-[10px] uppercase font-normal text-slate-500 rounded-xl"
              >
                Prev
              </Button>
              <div className="text-[10px] font-normal text-slate-600 px-2">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 text-[10px] uppercase font-normal text-slate-500 rounded-xl"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
