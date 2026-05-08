import { useState, useMemo, useEffect } from "react";
import {
  generateRegistrationPDF,
  generateBatchAccessPasses,
  generateGuestExportPDF,
  generateYesianExportPDF,
  generateLocalStaffExportPDF,
  generateDriverStaffExportPDF,
  generateZipBackup
} from "@/lib/exportUtils";
import { generateParticipationCertificate } from "@/lib/certificateUtils";
import { locations } from "@/data/locations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, MapPin, School, Archive, CreditCard, User, Zap, FileArchive, Award, ScrollText, Truck } from "lucide-react";
import { Registration, GuestRegistration, YesianRegistration, LocalStaffRegistration, AwardeeRegistration, DriverStaffRegistration } from "../types";

interface ExportCenterProps {
  registrations: Registration[];
  guestRegistrations: GuestRegistration[];
  yesianRegistrations: YesianRegistration[];
  localStaffRegistrations: LocalStaffRegistration[];
  awardeeRegistrations: AwardeeRegistration[];
  driverStaffRegistrations: DriverStaffRegistration[];
}

export function ExportCenter({ registrations, guestRegistrations, yesianRegistrations, localStaffRegistrations, awardeeRegistrations, driverStaffRegistrations }: ExportCenterProps) {
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [isZipping, setIsZipping] = useState(false);
  const [isCertifying, setIsCertifying] = useState(false);

  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(registrations.map(r => r.zone))).sort();
    const schools = Array.from(new Set(registrations.map(r => r.school))).sort();
    const classes = Array.from(new Set(registrations.map(r => r.className))).sort();
    return { zones, schools, classes };
  }, [registrations]);

  const filteredSchools = useMemo(() => {
    if (selectedZone === "all") return filterOptions.schools;
    return Array.from(new Set(
      registrations
        .filter(r => r.zone === selectedZone)
        .map(r => r.school)
    )).sort();
  }, [selectedZone, filterOptions.schools, registrations]);

  const filteredClasses = useMemo(() => {
    if (selectedZone === "all") return filterOptions.classes;
    return Array.from(new Set(
      registrations
        .filter(r => r.zone === selectedZone)
        .map(r => r.className)
    )).sort();
  }, [selectedZone, filterOptions.classes, registrations]);

  // Reset dependent filters when zone changes
  useEffect(() => {
    setSelectedSchool("all");
    setSelectedClass("all");
  }, [selectedZone]);

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  const handleGeneratePDF = async (type: 'zone' | 'school' | 'class' | 'all') => {
    let dataToExport = registrations;
    let title = "Master Registration Report";
    let filenameSuffix = "all";

    if (type === 'zone') {
      if (!selectedZone || selectedZone === 'all') return alert("Please select a zone before generating a report.");
      dataToExport = registrations.filter(r => r.zone === selectedZone);
      title = `Zone Report: ${selectedZone}`;
      filenameSuffix = `zone_${selectedZone.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    } else if (type === 'school') {
      if (!selectedSchool || selectedSchool === 'all') return alert("Please select a school before generating a report.");
      dataToExport = registrations.filter(r => r.school === selectedSchool);
      title = `School Report: ${getSchoolName(selectedSchool)}`;
      filenameSuffix = `school_${selectedSchool}`;
    } else if (type === 'class') {
      if (!selectedClass || selectedClass === 'all') return alert("Please select a class before generating a report.");
      dataToExport = registrations.filter(r => r.className === selectedClass);
      title = `Class Report: Grade ${selectedClass}`;
      filenameSuffix = `class_${selectedClass}`;
    }

    await generateRegistrationPDF(dataToExport, title, `genius_jam_${filenameSuffix}`);
  };

  const handleGeneratePasses = async (type: 'zone' | 'school' | 'class') => {
    let dataToExport = registrations;
    let filenameSuffix = "all";

    if (type === 'zone') {
      if (!selectedZone || selectedZone === 'all') return alert("Please select a zone.");
      dataToExport = registrations.filter(r => r.zone === selectedZone);
      filenameSuffix = `passes_zone_${selectedZone.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    } else if (type === 'school') {
      if (!selectedSchool || selectedSchool === 'all') return alert("Please select a school.");
      dataToExport = registrations.filter(r => r.school === selectedSchool);
      filenameSuffix = `passes_school_${selectedSchool}`;
    } else if (type === 'class') {
      if (!selectedClass || selectedClass === 'all') return alert("Please select a class.");
      dataToExport = registrations.filter(r => r.className === selectedClass);
      filenameSuffix = `passes_class_${selectedClass}`;
    }

    await generateBatchAccessPasses(dataToExport, filenameSuffix);
  };

  const handleGenerateCertificates = async (scope: 'zone' | 'school' | 'class' | 'all-students' | 'all-awardees') => {
    setIsCertifying(true);
    try {
      if (scope === 'all-awardees') {
        await generateParticipationCertificate(awardeeRegistrations, 'Certificates_Awardees', 'awardee');
        return;
      }
      let dataToExport = registrations;
      let suffix = 'all_students';
      if (scope === 'zone') {
        if (!selectedZone || selectedZone === 'all') { alert('Please select a zone.'); return; }
        dataToExport = registrations.filter(r => r.zone === selectedZone);
        suffix = `zone_${selectedZone.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
      } else if (scope === 'school') {
        if (!selectedSchool || selectedSchool === 'all') { alert('Please select a school.'); return; }
        dataToExport = registrations.filter(r => r.school === selectedSchool);
        suffix = `school_${selectedSchool}`;
      } else if (scope === 'class') {
        if (!selectedClass || selectedClass === 'all') { alert('Please select a class.'); return; }
        dataToExport = registrations.filter(r => r.className === selectedClass);
        suffix = `class_${selectedClass}`;
      }
      await generateParticipationCertificate(dataToExport, `Certificates_Students_${suffix}`, 'student');
    } finally {
      setIsCertifying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Zone Report */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-white relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <MapPin size={18} className="text-indigo-600" />
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">Zone Export</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-1">Operational zones.</p>

            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-full mb-3 h-10 rounded-lg bg-slate-50/80 backdrop-blur border border-slate-100/50 font-medium text-[11px] text-slate-700 shadow-inner">
                <SelectValue placeholder="Target Zone..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border flex flex-col shadow-xl">
                <SelectItem value="all">All Zones</SelectItem>
                {filterOptions.zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 mt-auto">
              <Button onClick={() => handleGeneratePDF('zone')} className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]">
                <Download className="mr-2 h-3 w-3" /> PDF Report
              </Button>
              <Button onClick={() => handleGeneratePasses('zone')} className="w-full h-9 font-black rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest text-[8px]">
                <CreditCard className="mr-2 h-3 w-3" /> Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* School Report */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-white relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <School size={18} className="text-emerald-600" />
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">School Export</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-1">Specific institutions.</p>

            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger className="w-full mb-3 h-auto min-h-[2.5rem] py-2 rounded-lg bg-slate-50/80 backdrop-blur border border-slate-100/50 font-medium text-slate-700 shadow-inner [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words [&>span]:text-left text-[10px] md:text-[11px]">
                <SelectValue placeholder="Institution..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border flex flex-col shadow-xl">
                <SelectItem value="all">All Institutions</SelectItem>
                {filteredSchools.map(s => (
                  <SelectItem key={s} value={s}>
                    <div className="whitespace-normal break-words text-xs leading-snug md:text-sm md:leading-normal max-w-[75vw] md:max-w-none py-1">
                      {getSchoolName(s)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 mt-auto">
              <Button onClick={() => handleGeneratePDF('school')} className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]">
                <Download className="mr-2 h-3 w-3" /> PDF Report
              </Button>
              <Button onClick={() => handleGeneratePasses('school')} className="w-full h-9 font-black rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest text-[8px]">
                <CreditCard className="mr-2 h-3 w-3" /> Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Class Report */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-white relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-rose-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-50 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Archive size={18} className="text-rose-600" />
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">Class Export</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-1">Grade levels.</p>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full mb-3 h-10 rounded-lg bg-slate-50/80 backdrop-blur border border-slate-100/50 font-medium text-[11px] text-slate-700 shadow-inner">
                <SelectValue placeholder="Grade Level..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border flex flex-col shadow-xl">
                <SelectItem value="all">All Classes</SelectItem>
                {filteredClasses.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 mt-auto">
              <Button onClick={() => handleGeneratePDF('class')} className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]">
                <Download className="mr-2 h-3 w-3" /> PDF Report
              </Button>
              <Button onClick={() => handleGeneratePasses('class')} className="w-full h-9 font-black rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all uppercase tracking-widest text-[8px]">
                <CreditCard className="mr-2 h-3 w-3" /> Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Master Student Report */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-white relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-slate-400 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <FileText size={18} className="text-slate-900" />
              </div>
              <div className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                {registrations.length} Total
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">Master Dump</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-1">Complete student registry.</p>

            <div className="flex flex-col gap-2 mt-auto">
              <Button onClick={() => handleGeneratePDF('all')} className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]">
                <Download className="mr-2 h-3 w-3" /> Export Complete DB
              </Button>
              <Button 
                disabled={isZipping}
                onClick={() => {
                  setIsZipping(true);
                  generateZipBackup(registrations, "Master Student Registry", "genius_jam_master_backup")
                    .finally(() => setIsZipping(false));
                }}
                className="w-full h-9 font-black rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all uppercase tracking-widest text-[8px]"
              >
                <FileArchive className={`mr-2 h-3 w-3 ${isZipping ? 'animate-bounce' : ''}`} /> 
                {isZipping ? 'Zipping...' : 'Download ZIP Backup'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guest Export */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-emerald-50/30 relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <User size={18} className="text-emerald-700" />
              </div>
              <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                {guestRegistrations.length} Guests
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">Guest Ledger</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-1">Visitor manifests.</p>

            <div className="flex flex-col gap-2 mt-auto">
              <Button
                onClick={() => generateGuestExportPDF(guestRegistrations, "Guest Registration Report", "genius_jam_guests")}
                className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]"
              >
                <Download className="mr-2 h-3 w-3" /> PDF Report
              </Button>
              <Button
                onClick={() => generateBatchAccessPasses(guestRegistrations, "passes_guests", 'guest')}
                className="w-full h-9 font-black rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest text-[8px]"
              >
                <CreditCard className="mr-2 h-3 w-3" /> Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Yesian Export */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-amber-50/30 relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Zap size={18} className="text-amber-600" />
              </div>
              <div className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                {yesianRegistrations.length} Members
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">Yesians Data</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-1">YES INDIA members.</p>

            <div className="flex flex-col gap-2 mt-auto">
              <Button
                onClick={() => generateYesianExportPDF(yesianRegistrations, "Yesian Member Report", "genius_jam_yesians")}
                className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]"
              >
                <Download className="mr-2 h-3 w-3" /> PDF Roster
              </Button>
              <Button
                onClick={() => generateBatchAccessPasses(yesianRegistrations, "passes_yesians", 'yesian')}
                className="w-full h-9 font-black rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-100 transition-all uppercase tracking-widest text-[8px]"
              >
                <CreditCard className="mr-2 h-3 w-3" /> Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Local Staff Export */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-sky-50/30 relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-sky-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <User size={18} className="text-sky-600" />
              </div>
              <div className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                {localStaffRegistrations.length} Staff
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">Staff Registry</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-1">Support staff.</p>

            <div className="flex flex-col gap-2 mt-auto">
              <Button
                onClick={() => generateLocalStaffExportPDF(localStaffRegistrations, "Local Staff Report", "genius_jam_local_staff")}
                className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]"
              >
                <Download className="mr-2 h-3 w-3" /> PDF Registry
              </Button>
              <Button
                onClick={() => generateBatchAccessPasses(localStaffRegistrations, "passes_local_staff", 'local-staff')}
                className="w-full h-9 font-black rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow-lg shadow-sky-100 transition-all uppercase tracking-widest text-[8px]"
              >
                <CreditCard className="mr-2 h-3 w-3" /> Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Driver & Staff Export */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-slate-50/30 relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-slate-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Truck size={18} className="text-slate-600" />
              </div>
              <div className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                {driverStaffRegistrations.length} Drivers
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">Drivers Registry</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-1">Transport & logistical staff.</p>

            <div className="flex flex-col gap-2 mt-auto">
              <Button
                onClick={() => generateDriverStaffExportPDF(driverStaffRegistrations, "Drivers & Support Staff Report", "genius_jam_drivers")}
                className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]"
              >
                <Download className="mr-2 h-3 w-3" /> PDF Registry
              </Button>
              <Button
                onClick={() => generateBatchAccessPasses(driverStaffRegistrations, "passes_drivers", 'driver-staff')}
                className="w-full h-9 font-black rounded-lg bg-slate-600 text-white hover:bg-slate-700 shadow-lg shadow-slate-100 transition-all uppercase tracking-widest text-[8px]"
              >
                <CreditCard className="mr-2 h-3 w-3" /> Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Participation Certificates */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-emerald-50/20 relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <ScrollText size={18} className="text-emerald-700" />
              </div>
              <div className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                Students
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">Participation Certs</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-2">Bulk-issue certificates by zone, school, or class.</p>

            <div className="flex flex-col gap-2 mt-auto">
              <Button
                disabled={isCertifying}
                onClick={() => handleGenerateCertificates('zone')}
                className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]"
              >
                <MapPin className="mr-2 h-3 w-3" /> By Zone
              </Button>
              <Button
                disabled={isCertifying}
                onClick={() => handleGenerateCertificates('school')}
                className="w-full h-9 font-black rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[8px]"
              >
                <School className="mr-2 h-3 w-3" /> By School
              </Button>
              <Button
                disabled={isCertifying}
                onClick={() => handleGenerateCertificates('class')}
                className="w-full h-9 font-black rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest text-[8px]"
              >
                <ScrollText className={`mr-2 h-3 w-3 ${isCertifying ? 'animate-pulse' : ''}`} />
                {isCertifying ? 'Generating...' : 'By Class'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Awardee Participation Certificates */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-violet-50/20 relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />

          <CardContent className="p-5 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Award size={18} className="text-violet-700" />
              </div>
              <div className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase">
                {awardeeRegistrations.length} Awardees
              </div>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-0.5">Awardee Certs</h3>
            <p className="text-[11px] font-medium text-slate-500 mb-4 max-w-[200px] leading-relaxed line-clamp-2">Issue participation certificates to all awardees at once.</p>

            <div className="flex flex-col gap-2 mt-auto">
              <Button
                disabled={isCertifying || awardeeRegistrations.length === 0}
                onClick={() => handleGenerateCertificates('all-awardees')}
                className="w-full h-9 font-black rounded-lg bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-100 transition-all uppercase tracking-widest text-[8px]"
              >
                <Award className={`mr-2 h-3 w-3 ${isCertifying ? 'animate-pulse' : ''}`} />
                {isCertifying ? 'Generating...' : 'Issue All Certificates'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
