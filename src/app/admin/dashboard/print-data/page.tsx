"use client";

import { useMemo, useState } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { locations } from "@/data/locations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, School, Users, FileText, CheckSquare, FileSpreadsheet, MapPin } from "lucide-react";
import { generateChecklistPDF, generateSchoolExcelIndividual, generateSchoolSummaryExcel } from "@/lib/exportUtils";

export default function PrintDataPage() {
  const {
    registrations,
    localStaffRegistrations,
    volunteerRegistrations,
    scoutTeamRegistrations,
    alumniRegistrations,
    awardeeRegistrations,
    qiraathRegistrations,
  } = useDashboardData();

  const [searchTerm, setSearchTerm] = useState("");

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find((s) => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  const getZoneName = (schoolId: string) => {
    for (const zone of locations) {
      if (zone.schools.some((s) => s.id === schoolId)) return zone.name;
    }
    return null;
  };

  // Build a flat map of all people keyed by resolved school ID
  const schoolsWithData = useMemo(() => {
    const schoolMap: Record<string, any[]> = {};

    const allPeople = [
      ...registrations.map((r) => ({ ...r, category: "Student", displayName: r.studentName })),
      ...localStaffRegistrations.map((r) => ({ ...r, category: "Staff", displayName: `${r.name} (Staff)` })),
      ...volunteerRegistrations.map((r) => ({ ...r, category: "Volunteer", displayName: `${r.volunteerName} (Volunteer)` })),
      ...scoutTeamRegistrations.map((r) => ({ ...r, category: "Scout", displayName: `${r.name} (Scout)` })),
      ...alumniRegistrations.map((r) => ({ ...r, category: "Alumni", displayName: `${r.name} (Alumni)` })),
      ...awardeeRegistrations.map((r) => ({ ...r, category: "Awardee", displayName: `${r.name} (Awardee)` })),
      ...qiraathRegistrations.map((r) => ({ ...r, category: "Qiraath", displayName: `${r.name} (Qiraath)` })),
    ];

    const resolveSchoolId = (s: string) => {
      if (!s) return "direct";
      for (const zone of locations) {
        if (zone.schools.some((sch) => sch.id === s)) return s;
      }
      for (const zone of locations) {
        const found = zone.schools.find((sch) => sch.name === s);
        if (found) return found.id;
      }
      return s;
    };

    allPeople.forEach((person) => {
      const sId = resolveSchoolId(person.school);
      if (!schoolMap[sId]) schoolMap[sId] = [];
      schoolMap[sId].push({ ...person, studentName: person.displayName });
    });

    return Object.entries(schoolMap).map(([schoolId, people]) => ({
      id: schoolId,
      name: schoolId === "direct" ? "Direct Registrations" : getSchoolName(schoolId),
      zoneName: schoolId === "direct" ? null : getZoneName(schoolId),
      count: people.length,
      people: people.sort((a, b) => (a.studentName || "").localeCompare(b.studentName || "")),
    }));
  }, [
    registrations,
    localStaffRegistrations,
    volunteerRegistrations,
    scoutTeamRegistrations,
    alumniRegistrations,
    awardeeRegistrations,
    qiraathRegistrations,
  ]);

  // Group schools by zone using locations order
  const zoneGroups = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();

    // Map of zoneId → { zoneName, schools[] }
    const grouped: { zoneId: string; zoneName: string; schools: typeof schoolsWithData }[] = [];

    for (const zone of locations) {
      const zoneSchools = schoolsWithData.filter(
        (s) => s.zoneName === zone.name &&
        s.name.toLowerCase().includes(lowerSearch)
      );
      if (zoneSchools.length > 0) {
        grouped.push({ zoneId: zone.id, zoneName: zone.name, schools: zoneSchools });
      }
    }

    // Direct / unknown at the end
    const direct = schoolsWithData.filter(
      (s) => s.id === "direct" && s.name.toLowerCase().includes(lowerSearch)
    );
    if (direct.length > 0) {
      grouped.push({ zoneId: "direct", zoneName: "Direct Registrations", schools: direct });
    }

    return grouped;
  }, [schoolsWithData, searchTerm]);

  const totalSchools = schoolsWithData.filter((s) => s.id !== "direct").length;
  const totalEntries = schoolsWithData.reduce((a, s) => a + s.count, 0);

  const handlePrint = async (school: any) => {
    await generateChecklistPDF(
      school.people,
      school.name,
      `Checklist_${school.name.replace(/\s+/g, "_")}`
    );
  };

  const handleSchoolExcel = (school: any) => {
    generateSchoolExcelIndividual(
      school.people,
      school.name,
      `Excel_${school.name.replace(/\s+/g, "_")}`
    );
  };

  const handleAllSchoolsExcel = () => {
    const allPeople = schoolsWithData.flatMap((s) => s.people);
    generateSchoolSummaryExcel(allPeople, `All_Schools_Summary_${Date.now()}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-normal text-slate-900 tracking-tight">Print Data</h1>
          <p className="text-slate-500 text-sm mt-1">
            Generate attendance checklists and Excel reports — grouped by campus and zone.
          </p>
          <div className="flex gap-4 mt-3">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {zoneGroups.filter(z => z.zoneId !== "direct").length} Zones
            </span>
            <span className="text-slate-200">|</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {totalSchools} Schools
            </span>
            <span className="text-slate-200">|</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              {totalEntries} Total Entries
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Print All Campuses */}
          <Button
            onClick={async () => {
              const allPeople = schoolsWithData.flatMap((s) => s.people);
              await generateChecklistPDF(allPeople, "Comprehensive Event Checklist", "Consolidated_Checklist");
            }}
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-2 font-normal shadow-sm"
          >
            <Printer size={18} className="text-indigo-600" />
            Print All Campuses
          </Button>

          {/* Export All Schools Excel */}
          <Button
            onClick={handleAllSchoolsExcel}
            variant="outline"
            className="h-11 rounded-2xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 gap-2 font-normal shadow-sm"
          >
            <FileSpreadsheet size={18} className="text-emerald-600" />
            Export All Schools (Excel)
          </Button>

          {/* Search */}
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search campus..."
              className="pl-10 h-11 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Zone-wise Groups */}
      {zoneGroups.length === 0 ? (
        <div className="py-20 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-300 mb-4">
            <School size={40} />
          </div>
          <h3 className="text-slate-900 font-medium text-lg">No campus data found</h3>
          <p className="text-slate-500">Try adjusting your search or check if registrations exist.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {zoneGroups.map((group) => (
            <div key={group.zoneId}>
              {/* Zone Header Banner */}
              <div className={`flex items-center gap-3 mb-5 ${group.zoneId === "direct" ? "" : ""}`}>
                <div
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-sm shadow-sm ${
                    group.zoneId === "direct"
                      ? "bg-slate-100 text-slate-600"
                      : "bg-indigo-950 text-white"
                  }`}
                >
                  <MapPin size={15} className={group.zoneId === "direct" ? "text-slate-400" : "text-indigo-300"} />
                  {group.zoneId === "direct" ? "Direct Registrations" : `${group.zoneName} Zone`}
                </div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 px-3 py-1 rounded-full bg-slate-50">
                  {group.schools.length} {group.schools.length === 1 ? "School" : "Schools"} ·{" "}
                  {group.schools.reduce((a, s) => a + s.count, 0)} Entries
                </div>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* School Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {group.schools.map((school) => (
                  <Card
                    key={school.id}
                    className="border-none shadow-sm shadow-slate-200/50 rounded-[28px] overflow-hidden bg-white group hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform duration-500">
                          <School size={18} />
                        </div>
                        <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-500">
                          {school.count} ENTRIES
                        </div>
                      </div>
                      <CardTitle className="text-base font-normal text-slate-900 mt-3 leading-snug">
                        {school.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent>
                      <div className="flex flex-col gap-3 mt-1">
                        {/* Feature tags */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg">
                            <CheckSquare size={11} className="text-emerald-500" />
                            Attendance columns
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg">
                            <FileText size={11} className="text-blue-500" />
                            Distribution tracking
                          </div>
                        </div>

                        {/* Print PDF */}
                        <Button
                          onClick={() => handlePrint(school)}
                          className="w-full h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-sm font-normal shadow-lg shadow-indigo-100 transition-all duration-300"
                        >
                          <Printer size={16} />
                          Print Checklist PDF
                        </Button>

                        {/* Export Excel */}
                        <Button
                          onClick={() => handleSchoolExcel(school)}
                          variant="outline"
                          className="w-full h-10 rounded-2xl border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 gap-2 text-sm font-normal shadow-sm transition-all duration-300"
                        >
                          <FileSpreadsheet size={16} className="text-emerald-600" />
                          Export School Excel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Info */}
      <div className="bg-slate-900 rounded-[40px] p-8 mt-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <h3 className="text-xl font-normal text-white mb-2">Print Layout Information</h3>
          <p className="text-slate-400 text-sm max-w-2xl font-light leading-relaxed">
            The checklist includes specific columns for{" "}
            <strong className="text-slate-200">Badge, Arrival, Lunch, Spell 2 Attendance, Departure, and Certificate</strong>{" "}
            distribution tracking. Each page is formatted for portrait printing. The "Print All Campuses" PDF includes
            a school name header before each campus section.
          </p>
        </div>
      </div>
    </div>
  );
}
