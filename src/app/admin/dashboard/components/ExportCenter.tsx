import { useState, useMemo } from "react";
import { 
  generateRegistrationPDF, 
  generateBatchAccessPasses,
  generateGuestExportPDF,
  generateYesianExportPDF
} from "@/lib/exportUtils";
import { locations } from "@/data/locations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, MapPin, School, Archive, CreditCard, User, Zap } from "lucide-react";
import { Registration, GuestRegistration, YesianRegistration } from "../types";

interface ExportCenterProps {
  registrations: Registration[];
  guestRegistrations: GuestRegistration[];
  yesianRegistrations: YesianRegistration[];
}

export function ExportCenter({ registrations, guestRegistrations, yesianRegistrations }: ExportCenterProps) {
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");

  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(registrations.map(r => r.zone))).sort();
    const schools = Array.from(new Set(registrations.map(r => r.school))).sort();
    const classes = Array.from(new Set(registrations.map(r => r.className))).sort();
    return { zones, schools, classes };
  }, [registrations]);

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

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Master Export Center</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-3">Batch process Reports & Access Passes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Zone Report */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-white relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-indigo-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />
          
          <CardContent className="p-8 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-indigo-50 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <MapPin size={24} className="text-indigo-600" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Zone-wise Export</h3>
            <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[200px] leading-relaxed">Process records filtered by operational zones.</p>

            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-full mb-6 h-14 rounded-2xl bg-slate-50/80 backdrop-blur border border-slate-100/50 font-medium text-sm text-slate-700 shadow-inner">
                <SelectValue placeholder="Select Target Zone..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border flex flex-col shadow-xl">
                <SelectItem value="all">All Zones</SelectItem>
                {filterOptions.zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-3 mt-auto">
              <Button onClick={() => handleGeneratePDF('zone')} className="w-full h-12 font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                <Download className="mr-2 h-4 w-4" /> Download PDF Report
              </Button>
              <Button onClick={() => handleGeneratePasses('zone')} className="w-full h-12 font-black rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all uppercase tracking-widest text-[10px]">
                <CreditCard className="mr-2 h-4 w-4" /> Generate Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* School Report */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-white relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />
          
          <CardContent className="p-8 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-50 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <School size={24} className="text-emerald-600" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">School Export</h3>
            <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[200px] leading-relaxed">Process sheets for specific educational institutions.</p>

            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger className="w-full mb-6 h-auto min-h-[3.5rem] py-3 rounded-2xl bg-slate-50/80 backdrop-blur border border-slate-100/50 font-medium text-slate-700 shadow-inner [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:break-words [&>span]:text-left text-xs md:text-sm">
                <SelectValue placeholder="Select Institution..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border flex flex-col shadow-xl">
                <SelectItem value="all">All Institutions</SelectItem>
                {filterOptions.schools.map(s => (
                  <SelectItem key={s} value={s}>
                    <div className="whitespace-normal break-words text-xs leading-snug md:text-sm md:leading-normal max-w-[75vw] md:max-w-none py-1">
                      {getSchoolName(s)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-3 mt-auto">
              <Button onClick={() => handleGeneratePDF('school')} className="w-full h-12 font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                <Download className="mr-2 h-4 w-4" /> Download PDF Report
              </Button>
              <Button onClick={() => handleGeneratePasses('school')} className="w-full h-12 font-black rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all uppercase tracking-widest text-[10px]">
                <CreditCard className="mr-2 h-4 w-4" /> Generate Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Class Report */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-white relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-rose-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />
          
          <CardContent className="p-8 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-rose-50 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Archive size={24} className="text-rose-600" />
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Class-wise Export</h3>
            <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[200px] leading-relaxed">Extract statistical data by student grade levels.</p>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full mb-6 h-14 rounded-2xl bg-slate-50/80 backdrop-blur border border-slate-100/50 font-medium text-sm text-slate-700 shadow-inner">
                <SelectValue placeholder="Select Grade Level..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border flex flex-col shadow-xl">
                <SelectItem value="all">All Classes</SelectItem>
                {filterOptions.classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-3 mt-auto">
              <Button onClick={() => handleGeneratePDF('class')} className="w-full h-12 font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                <Download className="mr-2 h-4 w-4" /> Download PDF Report
              </Button>
              <Button onClick={() => handleGeneratePasses('class')} className="w-full h-12 font-black rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all uppercase tracking-widest text-[10px]">
                <CreditCard className="mr-2 h-4 w-4" /> Generate Access Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Master Student Report */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-white relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-slate-400 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />
          
          <CardContent className="p-8 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <FileText size={24} className="text-slate-900" />
              </div>
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                {registrations.length} Total
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Master Dump</h3>
            <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[200px] leading-relaxed">Complete, unfiltered PDF registry of all students.</p>

            <Button onClick={() => handleGeneratePDF('all')} className="w-full h-12 mt-auto font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
              <Download className="mr-2 h-4 w-4" /> Export Complete DB
            </Button>
          </CardContent>
        </Card>

        {/* Guest Export */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-emerald-50/30 relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />
          
          <CardContent className="p-8 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <User size={24} className="text-emerald-700" />
              </div>
              <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                {guestRegistrations.length} Guests
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Guest Ledger</h3>
            <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[200px] leading-relaxed">Export visitor manifests with contact addresses.</p>

            <Button 
                onClick={() => generateGuestExportPDF(guestRegistrations, "Guest Registration Report", "genius_jam_guests")} 
                className="w-full h-12 mt-auto font-black rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all uppercase tracking-widest text-[10px]"
            >
              <Download className="mr-2 h-4 w-4" /> Download Manifest
            </Button>
          </CardContent>
        </Card>

        {/* Yesian Export */}
        <Card className="border border-slate-100 shadow-sm rounded-[32px] overflow-hidden bg-amber-50/30 relative group transition-all duration-500 hover:shadow-xl hover:translate-y-[-4px]">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity duration-700 pointer-events-none" />
          <div className="absolute inset-px rounded-[31px] border border-white opacity-60 pointer-events-none z-10" />
          
          <CardContent className="p-8 relative z-20 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-amber-100 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Zap size={24} className="text-amber-600" />
              </div>
              <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                {yesianRegistrations.length} Members
              </div>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Yesian Roster</h3>
            <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-[200px] leading-relaxed">Complete assignment data for YES INDIA members.</p>

            <Button 
                onClick={() => generateYesianExportPDF(yesianRegistrations, "Yesian Member Report", "genius_jam_yesians")}
                className="w-full h-12 mt-auto font-black rounded-xl bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-200 transition-all uppercase tracking-widest text-[10px]"
            >
              <Download className="mr-2 h-4 w-4" /> Download Roster
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
