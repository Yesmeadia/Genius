"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  Search, CheckCircle2, XCircle, Loader2,
  MapPin, School, Users, Check, RefreshCcw,
  ArrowRight, ShieldCheck, UserCheck, UserX,
  Filter, RotateCcw, User, ExternalLink, Download,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import { locations } from "@/data/locations";
import { useDashboardData } from "../components/DashboardDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

export default function AttendancePage() {
  const {
    registrations, guestRegistrations, yesianRegistrations,
    localStaffRegistrations, alumniRegistrations, volunteerRegistrations,
    awardeeRegistrations, qiraathRegistrations, driverStaffRegistrations,
    scoutTeamRegistrations, loading
  } = useDashboardData();

  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [selectedSchool, setSelectedSchool] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find((s) => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  // Combine all participants
  const allParticipants = useMemo(() => {
    const normalize = (data: any[], category: string, coll: string) => {
      return data.map(item => {
        const rawSchool = item.school || item.schoolName || item.institution || item.designation || item.address || "-";
        const resolvedSchool = (item.school && item.school.length < 10) ? getSchoolName(item.school) : rawSchool;

        return {
          ...item,
          id: item.id,
          displayName: item.studentName || item.name || item.volunteerName || "Unknown",
          displaySchool: resolvedSchool,
          category,
          coll,
          attendance: !!item.attendance,
          zone: item.zone || "all"
        };
      });
    };

    return [
      ...normalize(registrations, "Student", "registrations"),
      ...normalize(guestRegistrations, "Guest", "guest_registrations"),
      ...normalize(yesianRegistrations, "Yesian", "yesmeadian_registrations"),
      ...normalize(localStaffRegistrations, "Staff", "local_staff_registrations"),
      ...normalize(alumniRegistrations, "Alumni", "alumni_registrations"),
      ...normalize(volunteerRegistrations, "Volunteer", "volunteer_registrations"),
      ...normalize(awardeeRegistrations, "Awardee", "awardee_registrations"),
      ...normalize(qiraathRegistrations, "Qiraath", "qiraath_registrations"),
      ...normalize(driverStaffRegistrations, "Driver", "driver_staff_registrations"),
      ...normalize(scoutTeamRegistrations, "Scout", "scout_team_registrations"),
    ];
  }, [
    registrations, guestRegistrations, yesianRegistrations,
    localStaffRegistrations, alumniRegistrations, volunteerRegistrations,
    awardeeRegistrations, qiraathRegistrations, driverStaffRegistrations,
    scoutTeamRegistrations
  ]);

  const schoolsInZone = useMemo(() => {
    if (selectedZone === "all") return [];
    const zone = locations.find(z => z.id === selectedZone);
    return zone ? zone.schools : [];
  }, [selectedZone]);

  const filteredParticipants = useMemo(() => {
    return allParticipants.filter(p => {
      const pSchool = p.displaySchool.toString();
      const pZone = p.zone.toString();

      const zoneMatch = selectedZone === "all" || pZone === selectedZone;
      const schoolMatch = selectedSchool === "all" || pSchool === selectedSchool || pSchool === getSchoolName(selectedSchool);
      const searchMatch = p.displayName.toLowerCase().includes(searchTerm.toLowerCase());

      return zoneMatch && schoolMatch && searchMatch;
    });
  }, [allParticipants, selectedZone, selectedSchool, searchTerm]);

  const displayData = useMemo(() => {
    return filteredParticipants.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredParticipants, currentPage]);

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);

  const stats = useMemo(() => {
    const total = filteredParticipants.length;
    const present = filteredParticipants.filter(p => p.attendance).length;
    return { total, present, absent: total - present };
  }, [filteredParticipants]);

  const toggleAttendance = async (participant: any) => {
    setUpdatingId(participant.id);
    try {
      const newStatus = !participant.attendance;
      await updateDoc(doc(db, participant.coll, participant.id), {
        attendance: newStatus,
        attendedAt: newStatus ? serverTimestamp() : null
      });
    } catch (error) {
      console.error("Error updating attendance:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const markAllPresent = async () => {
    const unMarked = filteredParticipants.filter(p => !p.attendance);
    if (unMarked.length === 0) return;
    if (!window.confirm(`Mark all ${unMarked.length} participants as Present?`)) return;

    setUpdatingId("bulk");
    try {
      const promises = unMarked.map(p =>
        updateDoc(doc(db, p.coll, p.id), {
          attendance: true,
          attendedAt: serverTimestamp()
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Error bulk updating:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const resetFilters = () => {
    setSelectedZone("all");
    setSelectedSchool("all");
    setSearchTerm("");
    setCurrentPage(1);
  };

  const isFiltered = searchTerm !== "" || selectedZone !== "all" || selectedSchool !== "all";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Preparing Attendance Portal...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">

      {/* Stats Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Results</p>
              <p className="text-2xl font-normal text-slate-900 leading-none mt-1">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Present</p>
              <p className="text-2xl font-normal text-emerald-600 leading-none mt-1">{stats.present}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Absent</p>
              <p className="text-2xl font-normal text-rose-600 leading-none mt-1">{stats.absent}</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-end gap-3 px-2">
          <Button
            onClick={markAllPresent}
            disabled={stats.absent === 0 || updatingId === "bulk"}
            className="w-full h-full rounded-3xl bg-slate-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-widest shadow-xl transition-all gap-2 group"
          >
            {updatingId === "bulk" ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} className="group-hover:scale-110 transition-transform" />}
            Mark All Present
          </Button>
        </div>
      </div>

      <Card className="main-content border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
            <div className="relative flex-grow sm:w-72 max-w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <Input
                placeholder="Search participant by name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-11 h-10 bg-slate-50 border-none shadow-none focus-visible:ring-1 focus-visible:ring-slate-200 w-full text-xs font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              {isFiltered && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="h-10 px-4 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-2xl transition-all flex items-center gap-2"
                >
                  <RotateCcw size={14} />
                  Reset
                </Button>
              )}

              <Button
                onClick={() => {
                  import("@/lib/exportUtils").then(m => {
                    m.generateAttendancePDF(filteredParticipants, "Filtered Attendance Report", "attendance_report");
                  });
                }}
                className="h-10 px-4 text-[10px] uppercase tracking-widest font-bold bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 transition-all rounded-2xl shadow-sm gap-2"
              >
                <Download size={14} /> Export
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
            <Select value={selectedZone} onValueChange={(v) => { setSelectedZone(v); setSelectedSchool("all"); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-10 font-normal border-none bg-slate-50 shadow-sm rounded-2xl text-[12px]">
                <SelectValue placeholder="All Zones" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="all">All Zones</SelectItem>
                {locations.map(z => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedSchool} onValueChange={(v) => { setSelectedSchool(v); setCurrentPage(1); }} disabled={selectedZone === "all"}>
              <SelectTrigger className="w-full sm:w-[200px] h-10 font-normal border-none bg-slate-50 shadow-sm rounded-2xl text-[12px]">
                <SelectValue placeholder={selectedZone === "all" ? "Select Zone First" : "All Schools"} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="all">All Schools</SelectItem>
                {schoolsInZone.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-50">
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest pl-8">Participant</TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">Category</TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest">School</TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest text-center">Action</TableHead>
                  <TableHead className="py-4 text-[10px] font-normal text-slate-400 uppercase tracking-widest text-right pr-8">Profile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                          <Users size={40} />
                        </div>
                        <div>
                          <p className="text-slate-900 font-normal text-sm">No participants found</p>
                          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-bold">Try adjusting your filters</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  displayData.map((p) => (
                    <TableRow key={p.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-5 pl-8">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border border-slate-100 shadow-sm rounded-xl">
                            <AvatarImage src={p.photoUrl} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 text-slate-400 rounded-xl">
                              <User size={18} />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-normal text-slate-900 leading-none mb-1.5">{p.displayName}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {p.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge variant="outline" className={`rounded-lg border-none text-[9px] font-black uppercase tracking-widest px-2.5 py-1 ${p.category === 'Student' ? 'bg-indigo-50 text-indigo-600' :
                            p.category === 'Guest' ? 'bg-amber-50 text-amber-600' :
                              p.category === 'Awardee' ? 'bg-teal-50 text-teal-600' :
                                'bg-slate-100 text-slate-500'
                          }`}>
                          {p.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex flex-col">
                          <span className="text-[12px] text-slate-600 font-normal leading-tight mb-0.5">{p.displaySchool}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">{p.zone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        {p.attendance ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100/50 animate-in zoom-in-95 duration-300">
                            <CheckCircle2 size={12} strokeWidth={3} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Present</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 text-slate-300 border border-slate-100">
                            <XCircle size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Absent</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-5 text-center">
                        <Button
                          size="sm"
                          onClick={() => toggleAttendance(p)}
                          disabled={updatingId === p.id}
                          variant={p.attendance ? "ghost" : "default"}
                          className={`h-9 min-w-[120px] rounded-xl text-[10px] font-bold uppercase tracking-widest px-4 transition-all duration-300 ${p.attendance
                              ? 'text-rose-500 hover:bg-rose-50 hover:text-rose-600'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100'
                            }`}
                        >
                          {updatingId === p.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            p.attendance ? 'Mark Absent' : 'Mark Present'
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="py-5 text-right pr-8">
                        {(() => {
                          let route = 'student';
                          if (p.coll === 'guest_registrations') route = 'guest';
                          else if (p.coll === 'yesmeadian_registrations' || p.coll === 'yesian_registrations') route = 'yesian';
                          else if (p.coll === 'local_staff_registrations') route = 'local-staff';
                          else if (p.coll === 'alumni_registrations') route = 'alumni-achievers';
                          else if (p.coll === 'volunteer_registrations') route = 'volunteers';
                          else if (p.coll === 'awardee_registrations') route = 'awardee';
                          else if (p.coll === 'qiraath_registrations') route = 'qiraath';
                          else if (p.coll === 'driver_staff_registrations') route = 'driver-staff';
                          else if (p.coll === 'scout_team_registrations') route = 'scout-team';
                          
                          return (
                            <Link href={`/admin/dashboard/${route}/${p.id}`}>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                <ExternalLink size={18} />
                              </Button>
                            </Link>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {totalPages > 1 && (
          <div className="bg-white p-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredParticipants.length)} of {filteredParticipants.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="h-10 px-4 rounded-2xl border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
              >
                <ChevronLeft size={16} className="mr-1" />
                Prev
              </Button>
              <div className="h-10 flex items-center justify-center px-4 rounded-2xl bg-slate-50 text-[11px] font-bold text-slate-600 border border-slate-100/50 min-w-[80px]">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === totalPages}
                className="h-10 px-4 rounded-2xl border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}
