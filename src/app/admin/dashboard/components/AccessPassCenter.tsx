"use client";

import { useState, useMemo } from "react";
import { generateBatchAccessPasses } from "@/lib/exportUtils";
import { locations } from "@/data/locations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, Download, MapPin, School, Archive, 
  Users, Image as ImageIcon, CheckCircle2, AlertCircle, User 
} from "lucide-react";

interface Registration {
  id: string;
  studentName: string;
  parentage: string;
  className: string;
  gender: string;
  zone: string;
  school: string;
  withParent: boolean;
  createdAt: any;
  photoUrl?: string;
}

export default function AccessPassCenter({ registrations }: { registrations: Registration[] }) {
  const [selectedZone, setSelectedZone] = useState("all");
  const [selectedSchool, setSelectedSchool] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");

  const filterOptions = useMemo(() => {
    const zones = Array.from(new Set(registrations.map(r => r.zone))).sort();
    const schools = Array.from(new Set(registrations.map(r => r.school))).sort();
    const classes = Array.from(new Set(registrations.map(r => r.className))).sort();
    return { zones, schools, classes };
  }, [registrations]);

  const stats = useMemo(() => {
    return { total: registrations.length };
  }, [registrations]);

  const zoneData = useMemo(() => selectedZone === 'all' ? [] : registrations.filter(r => r.zone === selectedZone), [selectedZone, registrations]);
  const schoolData = useMemo(() => selectedSchool === 'all' ? [] : registrations.filter(r => r.school === selectedSchool), [selectedSchool, registrations]);
  const classData = useMemo(() => selectedClass === 'all' ? [] : registrations.filter(r => r.className === selectedClass), [selectedClass, registrations]);

  const previewReg = useMemo(() => {
    if (selectedZone !== 'all' && zoneData.length > 0) return zoneData[0];
    if (selectedSchool !== 'all' && schoolData.length > 0) return schoolData[0];
    if (selectedClass !== 'all' && classData.length > 0) return classData[0];
    if (registrations.length > 0) return registrations[0];
    return null;
  }, [selectedZone, zoneData, selectedSchool, schoolData, selectedClass, classData, registrations]);

  const getSchoolName = (schoolId: string) => {
    for (const zone of locations) {
      const school = zone.schools.find(s => s.id === schoolId);
      if (school) return school.name;
    }
    return schoolId;
  };

  const handleGeneratePasses = async (type: 'zone' | 'school' | 'class' | 'all') => {
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
      
      {/* Header & Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
        <div className="md:col-span-8">
          <h2 className="text-2xl font-normal text-slate-900 tracking-tight">Access Pass Center</h2>
          <p className="text-[11px] font-normal text-slate-500 uppercase tracking-widest mt-2">Manage and generate official event participation badges</p>
        </div>
        <div className="md:col-span-4 flex justify-end">
             <Button onClick={() => handleGeneratePasses('all')} className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100">
                <Download className="mr-2 h-4 w-4" /> Export All Passes
             </Button>
        </div>
      </div>

      <div className="flex justify-start">
        <Card className="border-none shadow-sm rounded-3xl bg-white p-6 min-w-[250px]">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Users size={24} />
                </div>
                <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Registrations</div>
                    <div className="text-2xl font-normal text-slate-900">{stats.total}</div>
                </div>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pass Preview Mockup */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Badge Preview</CardTitle>
                </CardHeader>
                <div className="p-6">
                    {/* Mock ID Card UI */}
                    <div className="aspect-[1/1.42] w-full max-w-[260px] mx-auto bg-white border border-slate-200 shadow-md relative flex flex-col overflow-hidden">
                        {/* 1. Top Bars */}
                        <div className="h-3 w-full bg-indigo-600" />
                        <div className="h-1 w-full bg-indigo-400" />
                        
                        <div className="px-4 py-3 pb-0 flex flex-col items-center flex-grow">
                            {/* 2. Logo */}
                            <img src="/Genius.png" className="h-4 mb-2 opacity-90" alt="Logo" />
                            
                            {/* 3. Titles */}
                            <div className="font-bold text-slate-900 text-[10px] tracking-wide mb-0.5">GENIUS JAM 3</div>
                            <div className="font-bold text-slate-400 text-[6px] tracking-widest uppercase">Official Access Pass</div>
                            
                            {/* Decorative Divider */}
                            <div className="w-16 border-b border-slate-200 my-2" />
                            
                            {/* Participant Photo */}
                            {(previewReg as any)?.photoUrl ? (
                                <img src={(previewReg as any).photoUrl} className="w-12 h-12 object-cover rounded-md mb-2 border border-slate-200 shadow-sm" alt="Student" />
                            ) : (
                                <div className="w-12 h-12 rounded-md bg-slate-50 border border-slate-100 mb-2 flex items-center justify-center text-slate-300 shadow-sm">
                                   <User size={18} />
                                </div>
                            )}
                            
                            {/* 4. Participant Name */}
                            <div className="font-bold text-slate-900 text-[10px] mt-0 mb-1 text-center leading-tight tracking-tight uppercase">
                                {previewReg ? previewReg.studentName : "STUDENT NAME"}
                            </div>
                            
                            {/* 5. Class & Gender Pill */}
                            <div className="bg-indigo-50 text-indigo-600 font-bold text-[6px] tracking-widest px-3 py-1 rounded-sm mb-4 uppercase">
                                {previewReg ? `CLASS ${previewReg.className} • ${previewReg.gender}` : "CLASS 10TH • MALE"}
                            </div>
                            
                            {/* 6. Assignment Meta Box */}
                            <div className="w-full bg-slate-50 border border-slate-200 p-2 px-3 text-left mb-auto shadow-sm">
                                <div className="text-[5px] text-slate-500 font-normal mb-0.5">ZONE ASSIGNMENT</div>
                                <div className="text-[7px] text-slate-900 font-bold mb-2 uppercase">{previewReg ? previewReg.zone.substring(0, 32) : "NORTH ZONE"}</div>
                                
                                <div className="text-[5px] text-slate-500 font-normal mb-0.5">INSTITUTION</div>
                                <div className="text-[7px] text-slate-900 font-bold leading-tight uppercase">{previewReg ? getSchoolName(previewReg.school).substring(0, 35) : "MODEL HIGHER SECONDARY EDUCATIONAL INSTITUTE"}</div>
                            </div>
                        </div>

                        {/* 7. Footer */}
                        <div className="px-3 pb-2 pt-2 flex justify-between items-end">
                             <div className="flex gap-[1px] h-3 items-end opacity-80">
                                 {[1,2,1,3,1,1,2,1,1,2,1,3,1,1].map((w, i) => (
                                     <div key={i} className="bg-slate-800 h-full" style={{ width: `${w}px` }} />
                                 ))}
                             </div>
                             <img src="/yeslogo.png" className="h-[8px]" alt="Footer Logo" />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-6 uppercase font-bold tracking-widest">Standard ID Format (70x100mm)</p>
                </div>
            </Card>
        </div>

        {/* Batch Actions Hub */}
        <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-xl font-normal text-slate-900">Batch Generation Hub</CardTitle>
                    <CardDescription>Filter and export high-quality participation passes for your assigned groups.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    
                    {/* Zone Pass */}
                    <div className="pb-8 border-b border-slate-50">
                        <div className="flex flex-col md:flex-row items-end gap-4">
                            <div className="w-full md:w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <MapPin size={24} />
                            </div>
                            <div className="flex-grow space-y-2">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Zone Assignment</Label>
                                 <Select value={selectedZone} onValueChange={setSelectedZone}>
                                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 border-none font-normal text-xs text-slate-600">
                                        <SelectValue placeholder="Select a zone..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-xl">
                                        <SelectItem value="all">All Zones</SelectItem>
                                        {filterOptions.zones.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                            </div>
                            <Button onClick={() => handleGeneratePasses('zone')} className="w-full md:w-auto h-12 px-8 font-normal rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                                Download Passes {zoneData.length > 0 && `(${zoneData.length})`}
                            </Button>
                        </div>
                    </div>

                    {/* School Pass */}
                    <div className="pb-8 border-b border-slate-50">
                        <div className="flex flex-col md:flex-row items-end gap-4">
                            <div className="w-full md:w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                <School size={24} />
                            </div>
                            <div className="flex-grow space-y-2">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Educational Institution</Label>
                                 <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 border-none font-normal text-xs text-slate-600">
                                        <SelectValue placeholder="Select institution..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-xl">
                                        <SelectItem value="all">All Institutions</SelectItem>
                                        {filterOptions.schools.map(s => <SelectItem key={s} value={s}>{getSchoolName(s)}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                            </div>
                            <Button onClick={() => handleGeneratePasses('school')} className="w-full md:w-auto h-12 px-8 font-normal rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                                Download Passes {schoolData.length > 0 && `(${schoolData.length})`}
                            </Button>
                        </div>
                    </div>

                    {/* Class Pass */}
                    <div className="pb-4">
                        <div className="flex flex-col md:flex-row items-end gap-4">
                            <div className="w-full md:w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <Archive size={24} />
                            </div>
                            <div className="flex-grow space-y-2">
                                 <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Grade Level</Label>
                                 <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="w-full h-12 rounded-2xl bg-slate-50 border-none font-normal text-xs text-slate-600">
                                        <SelectValue placeholder="Select class..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-xl">
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {filterOptions.classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
                                    </SelectContent>
                                 </Select>
                            </div>
                            <Button onClick={() => handleGeneratePasses('class')} className="w-full md:w-auto h-12 px-8 font-normal rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                                Download Passes {classData.length > 0 && `(${classData.length})`}
                            </Button>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

// Minimal inline Label for the component
function Label({ children, className, ...props }: any) {
    return <label className={`text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>{children}</label>
}
