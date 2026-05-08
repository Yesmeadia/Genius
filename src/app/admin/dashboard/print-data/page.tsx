"use client";

import { useMemo, useState } from "react";
import { useDashboardData } from "../components/DashboardDataContext";
import { locations } from "@/data/locations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Printer, School, Users, FileText, CheckSquare } from "lucide-react";
import { generateChecklistPDF } from "@/lib/exportUtils";

export default function PrintDataPage() {
  const { 
    registrations, 
    localStaffRegistrations,
    volunteerRegistrations,
    scoutTeamRegistrations,
    alumniRegistrations,
    awardeeRegistrations,
    qiraathRegistrations
  } = useDashboardData();

  const [searchTerm, setSearchTerm] = useState("");

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  const schoolsWithData = useMemo(() => {
    const schoolMap: Record<string, any[]> = {};

    const allPeople = [
      ...registrations.map(r => ({ ...r, category: "Student", displayName: r.studentName })),
      ...localStaffRegistrations.map(r => ({ ...r, category: "Staff", displayName: `${r.name} (Staff)` })),
      ...volunteerRegistrations.map(r => ({ ...r, category: "Volunteer", displayName: `${r.volunteerName} (Volunteer)` })),
      ...scoutTeamRegistrations.map(r => ({ ...r, category: "Scout", displayName: `${r.name} (Scout)` })),
      ...alumniRegistrations.map(r => ({ ...r, category: "Alumni", displayName: `${r.name} (Alumni)` })),
      ...awardeeRegistrations.map(r => ({ ...r, category: "Awardee", displayName: `${r.name} (Awardee)` })),
      ...qiraathRegistrations.map(r => ({ ...r, category: "Qiraath", displayName: `${r.name} (Qiraath)` }))
    ];

    // Helper to find school ID from name if it's not already an ID
    const resolveSchoolId = (s: string) => {
      if (!s) return "direct";
      // Check if it's already a valid ID
      for (const zone of locations) {
        if (zone.schools.some(sch => sch.id === s)) return s;
      }
      // Try to find ID by name
      for (const zone of locations) {
        const found = zone.schools.find(sch => sch.name === s);
        if (found) return found.id;
      }
      return s; // Fallback to original (might be a custom name)
    };

    allPeople.forEach(person => {
      const sId = resolveSchoolId(person.school);
      if (!schoolMap[sId]) {
        schoolMap[sId] = [];
      }
      schoolMap[sId].push({
        ...person,
        studentName: person.displayName // Map to expected field in PDF generator
      });
    });

    return Object.entries(schoolMap)
      .map(([schoolId, people]) => ({
        id: schoolId,
        name: schoolId === "direct" ? "Direct Registrations" : getSchoolName(schoolId),
        count: people.length,
        people: people.sort((a, b) => (a.studentName || "").localeCompare(b.studentName || ""))
      }))
      .filter(school => school.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (a.id === "direct") return 1;
        if (b.id === "direct") return -1;
        return a.name.localeCompare(b.name);
      });
  }, [registrations, localStaffRegistrations, volunteerRegistrations, scoutTeamRegistrations, alumniRegistrations, awardeeRegistrations, qiraathRegistrations, searchTerm]);

  const handlePrint = async (school: any) => {
    const filename = `Checklist_${school.name.replace(/\s+/g, '_')}`;
    await generateChecklistPDF(school.people, school.name, filename);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-normal text-slate-900 tracking-tight">Print Data</h1>
          <p className="text-slate-500 text-sm mt-1">Generate attendance and distribution checklists grouped by campus.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={async () => {
              const allPeople = schoolsWithData.flatMap(s => s.people);
              await generateChecklistPDF(allPeople, "Comprehensive Event Checklist", "Consolidated_Checklist");
            }}
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 gap-2 font-normal shadow-sm transition-all duration-300"
          >
            <Printer size={18} className="text-indigo-600" />
            Print All Campuses
          </Button>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schoolsWithData.map((school) => (
          <Card key={school.id} className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white group hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform duration-500">
                  <School size={20} />
                </div>
                <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-50 text-slate-500">
                  {school.count} ENTRIES
                </div>
              </div>
              <CardTitle className="text-lg font-normal text-slate-900 mt-4 leading-tight">
                {school.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Users size={14} />
                  <span>Includes students, staff, and participants</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                   <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                     <CheckSquare size={12} className="text-emerald-500" />
                     Attendance columns
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                     <FileText size={12} className="text-blue-500" />
                     Distribution tracking
                   </div>
                </div>

                <Button 
                  onClick={() => handlePrint(school)}
                  className="w-full h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white gap-2 font-normal shadow-lg shadow-indigo-100 mt-2 transition-all duration-300"
                >
                  <Printer size={18} />
                  Print Checklist PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {schoolsWithData.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-300 mb-4">
              <School size={40} />
            </div>
            <h3 className="text-slate-900 font-medium text-lg">No campus data found</h3>
            <p className="text-slate-500">Try adjusting your search or check if registrations exist.</p>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-[40px] p-8 mt-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <h3 className="text-xl font-normal text-white mb-2">Print Layout Information</h3>
          <p className="text-slate-400 text-sm max-w-2xl font-light leading-relaxed">
            The checklist includes specific columns for <strong>Badge, Arrival, Lunch, Spell 2 Attendance, Departure, and Certificate</strong> distribution tracking.
            Each page is formatted for landscape printing to ensure maximum space for manual ticking and notes.
          </p>
        </div>
      </div>
    </div>
  );
}
