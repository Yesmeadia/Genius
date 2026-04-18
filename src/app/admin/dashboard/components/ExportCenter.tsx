import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateRegistrationPDF, generateBatchAccessPasses } from "@/lib/exportUtils";
import { locations } from "@/data/locations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, MapPin, School, Archive, CreditCard } from "lucide-react";

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

export function ExportCenter({ registrations }: { registrations: Registration[] }) {
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-normal text-slate-900 tracking-tight">Analytics & Downloads</h2>
        <p className="text-[11px] font-normal text-slate-500 uppercase tracking-widest mt-2">Generate organized administrative reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zone Report */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white hover:shadow-md transition-all border-l-4 border-l-indigo-500">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50">
                <MapPin size={24} className="text-indigo-500" />
              </div>
            </div>
            <h3 className="text-lg font-normal text-slate-900 mb-2">Zone-wise Reports</h3>
            <p className="text-xs font-normal text-slate-500 mb-6">Filter and export registrations grouped by operational zones.</p>

            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-full mb-4 h-12 rounded-2xl bg-slate-50 border-none font-normal text-xs text-slate-600">
                <SelectValue placeholder="Select a zone..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="all">All Zones</SelectItem>
                {filterOptions.zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={() => handleGeneratePDF('zone')} className="flex-1 h-12 font-normal rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                <Download className="mr-2 h-4 w-4" /> Report
              </Button>
              <Button onClick={() => handleGeneratePasses('zone')} className="flex-1 h-12 font-normal rounded-2xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]">
                <CreditCard className="mr-2 h-4 w-4" /> Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* School Report */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white hover:shadow-md transition-all border-l-4 border-l-emerald-500">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50">
                <School size={24} className="text-emerald-500" />
              </div>
            </div>
            <h3 className="text-lg font-normal text-slate-900 mb-2">School-wise Reports</h3>
            <p className="text-xs font-normal text-slate-500 mb-6">Filter and export sheets targeting specific educational institutions.</p>

            <Select value={selectedSchool} onValueChange={setSelectedSchool}>
              <SelectTrigger className="w-full mb-4 h-12 rounded-2xl bg-slate-50 border-none font-normal text-xs text-slate-600">
                <SelectValue placeholder="Select an institution..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="all">All Institutions</SelectItem>
                {filterOptions.schools.map(s => <SelectItem key={s} value={s}>{getSchoolName(s)}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={() => handleGeneratePDF('school')} className="flex-1 h-12 font-normal rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                <Download className="mr-2 h-4 w-4" /> Report
              </Button>
              <Button onClick={() => handleGeneratePasses('school')} className="flex-1 h-12 font-normal rounded-2xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]">
                <CreditCard className="mr-2 h-4 w-4" /> Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Class Report */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white hover:shadow-md transition-all border-l-4 border-l-rose-500">
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50">
                <Archive size={24} className="text-rose-500" />
              </div>
            </div>
            <h3 className="text-lg font-normal text-slate-900 mb-2">Class-wise Reports</h3>
            <p className="text-xs font-normal text-slate-500 mb-6">Filter and export statistical data based on student grade levels.</p>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full mb-4 h-12 rounded-2xl bg-slate-50 border-none font-normal text-xs text-slate-600">
                <SelectValue placeholder="Select a class grade..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="all">All Classes</SelectItem>
                {filterOptions.classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button onClick={() => handleGeneratePDF('class')} className="flex-1 h-12 font-normal rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                <Download className="mr-2 h-4 w-4" /> Report
              </Button>
              <Button onClick={() => handleGeneratePasses('class')} className="flex-1 h-12 font-normal rounded-2xl bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px]">
                <CreditCard className="mr-2 h-4 w-4" /> Passes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Master Report */}
        <Card className="border-none shadow-sm shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white hover:shadow-md transition-all border-l-4 border-l-slate-900">
          <CardContent className="p-8 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-50">
                <FileText size={24} className="text-slate-900" />
              </div>
            </div>
            <h3 className="text-lg font-normal text-slate-900 mb-2">Master System Export</h3>
            <p className="text-xs font-normal text-slate-500 mb-6 flex-grow">A complete, unfiltered PDF database dump of all recorded transactions in the entire network.</p>

            <Button onClick={() => handleGeneratePDF('all')} className="w-full h-12 mt-auto font-normal rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[11px]">
              <Download className="mr-2 h-4 w-4" /> Export All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
