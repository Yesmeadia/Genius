"use client";

import { useState, useMemo, useRef } from "react";
import { generateBatchAccessPasses } from "@/lib/exportUtils";
import { locations, Zone } from "@/data/locations";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, User, Zap, School, Archive, ArrowRight, ShieldCheck, Trophy, MoreHorizontal, X } from "lucide-react";
import { AccessPassDesign } from "./AccessPassDesign";
import { Registration, GuestRegistration, YesianRegistration, LocalStaffRegistration, ScoutTeamRegistration, AwardeeRegistration, QiraathRegistration, MediaRegistration, VolunteerRegistration, AlumniRegistration } from "../types";
import { useDashboardData } from "./DashboardDataContext";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface AccessPassCenterProps {
    registrations: Registration[];
    guestRegistrations: GuestRegistration[];
    yesianRegistrations: YesianRegistration[];
    localStaffRegistrations: LocalStaffRegistration[];
    scoutTeamRegistrations: ScoutTeamRegistration[];
    awardeeRegistrations: AwardeeRegistration[];
    qiraathRegistrations: QiraathRegistration[];
    mediaRegistrations: MediaRegistration[];
    volunteerRegistrations: VolunteerRegistration[];
    alumniRegistrations: AlumniRegistration[];
}

type PassType = 'student' | 'guest' | 'yesian' | 'local-staff' | 'awardee' | 'guardian' | 'qiraath' | 'media';

const PASS_META: Record<PassType, { label: string; plural: string; color: string; bg: string; }> = {
    student: { label: 'Delegate', plural: 'Delegates', color: 'text-orange-600', bg: 'bg-orange-600' },
    guest: { label: 'Guest', plural: 'Guests', color: 'text-emerald-600', bg: 'bg-emerald-600' },
    yesian: { label: 'Official', plural: 'Officials', color: 'text-amber-600', bg: 'bg-amber-600' },
    'local-staff': { label: 'Staff', plural: 'Staff', color: 'text-sky-600', bg: 'bg-sky-600' },
    'awardee': { label: 'Awardee', plural: 'Awardees', color: 'text-violet-600', bg: 'bg-violet-600' },
    'guardian': { label: 'Guardian', plural: 'Guardians', color: 'text-pink-600', bg: 'bg-pink-600' },
    'qiraath': { label: 'Qiraath', plural: 'Qiraath', color: 'text-emerald-600', bg: 'bg-emerald-600' },
    'media': { label: 'Media', plural: 'Media', color: 'text-indigo-600', bg: 'bg-indigo-600' },
};

export default function AccessPassCenter({
    registrations,
    guestRegistrations,
    yesianRegistrations,
    localStaffRegistrations,
    scoutTeamRegistrations,
    awardeeRegistrations,
    qiraathRegistrations,
    mediaRegistrations,
    volunteerRegistrations,
    alumniRegistrations
}: AccessPassCenterProps) {
    const { dynamicLocations } = useDashboardData();
    const [passType, setPassType] = useState<PassType>('student');
    const [selectedZone, setSelectedZone] = useState("all");
    const [selectedSchool, setSelectedSchool] = useState("all");
    const [selectedClass, setSelectedClass] = useState("all");
    const [showSwitcher, setShowSwitcher] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const activeData = useMemo(() => {
        if (passType === 'student') return registrations;
        if (passType === 'guest') return guestRegistrations;
        if (passType === 'yesian') return yesianRegistrations;
        if (passType === 'local-staff') return localStaffRegistrations;
        if (passType === 'awardee') return awardeeRegistrations;
        if (passType === 'qiraath') return qiraathRegistrations;
        if (passType === 'media') return mediaRegistrations;
        if (passType === 'guardian') {
            const guardians: any[] = [];
            const allWithAcc = [
                ...registrations.map(r => ({ ...r, type: 'Student' })),
                ...alumniRegistrations.map(r => ({ ...r, type: 'Alumni' })),
                ...volunteerRegistrations.map(r => ({ ...r, type: 'Volunteer' })),
                ...awardeeRegistrations.map(r => ({ ...r, type: 'Awardee' })),
                ...qiraathRegistrations.map(r => ({ ...r, type: 'Qiraath' })),
                ...scoutTeamRegistrations.map(r => ({ ...r, type: 'Scout' }))
            ];
            
            allWithAcc.forEach(reg => {
                const baseName = (reg as any).studentName || (reg as any).volunteerName || (reg as any).name || 'Participant';
                if (reg.accompaniments && reg.accompaniments.length > 0) {
                    reg.accompaniments.forEach((acc, i) => {
                        guardians.push({
                            id: `${reg.id}-G${i}`,
                            guardianName: acc.name,
                            studentName: baseName,
                            school: (reg as any).school,
                            className: (reg as any).className,
                            zone: (reg as any).zone,
                            photoUrl: (reg as any).photoUrl
                        });
                    });
                } else if ((reg as any).parentName || reg.withParent) {
                    guardians.push({
                        id: `${reg.id}-G`,
                        guardianName: (reg as any).parentName || "Parent/Guardian",
                        studentName: baseName,
                        school: (reg as any).school,
                        className: (reg as any).className,
                        zone: (reg as any).zone,
                        photoUrl: (reg as any).photoUrl
                    });
                }
            });
            return guardians;
        }
        return registrations;
    }, [passType, registrations, guestRegistrations, yesianRegistrations, localStaffRegistrations, scoutTeamRegistrations, awardeeRegistrations, qiraathRegistrations, volunteerRegistrations, alumniRegistrations, mediaRegistrations]);

    const filteredData = useMemo(() => {
        let d = activeData as any[];
        if (selectedZone !== 'all') d = d.filter(r => r.zone === selectedZone);
        if (passType === 'student' || passType === 'guardian' || passType === 'qiraath') {
            if (selectedSchool !== 'all') d = d.filter(r => r.school === selectedSchool);
            if (selectedClass !== 'all') d = d.filter(r => r.className === selectedClass);
        }
        return d;
    }, [activeData, selectedZone, selectedSchool, selectedClass, passType]);

    const previewReg = useMemo(() =>
        filteredData.length > 0 ? filteredData[0] : null,
        [filteredData]);

    useGSAP(() => {
        gsap.from(".apc-card", { opacity: 0, y: 24, stagger: 0.08, duration: 0.7, ease: "power3.out" });
    }, { scope: containerRef });

    const getSchoolName = (schoolId: string) => {
        for (const zone of dynamicLocations) {
            const s = zone.schools.find(s => s.id === schoolId);
            if (s) return s.name;
        }
        return schoolId;
    };

    const handleExport = async (scope: 'zone' | 'school' | 'class' | 'all') => {
        let data = filteredData;
        let filename = `genius_passes_${passType}_all`;

        if (scope === 'zone') {
            if (selectedZone === 'all') return alert("Please select a zone.");
            data = (activeData as any[]).filter(r => r.zone === selectedZone);
            filename = `genius_passes_${passType}_zone_${selectedZone.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
        } else if (scope === 'school' && (passType === 'student' || passType === 'guardian' || passType === 'qiraath')) {
            if (selectedSchool === 'all') return alert("Please select a school.");
            data = (activeData as any[]).filter(r => r.school === selectedSchool);
            filename = `genius_passes_${passType}_school_${selectedSchool}`;
        } else if (scope === 'class' && (passType === 'student' || passType === 'guardian' || passType === 'qiraath')) {
            if (selectedClass === 'all') return alert("Please select a class.");
            data = (activeData as any[]).filter(r => r.className === selectedClass);
            filename = `genius_passes_${passType}_class_${selectedClass}`;
        }

        await generateBatchAccessPasses(data, filename, passType, dynamicLocations);
    };

    const meta = PASS_META[passType];

    return (
        <div ref={containerRef} className="max-w-7xl mx-auto space-y-10 pb-24 px-4">

            {/* ── HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 apc-card">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Genius Jam 3</p>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Pass Center</h1>
                    <p className="text-slate-500 text-sm mt-1">Generate, preview and export physical ID passes.</p>
                </div>

                {/* Pass type switcher */}
                <div className="flex items-center justify-end">
                    {!showSwitcher ? (
                        <Button
                            onClick={() => setShowSwitcher(true)}
                            className="h-10 rounded-xl bg-slate-900 text-white font-normal uppercase text-[10px] tracking-widest hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
                        >
                            <MoreHorizontal className="mr-2 h-4 w-4" /> {PASS_META[passType].plural}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-3 flex-wrap justify-end animate-in slide-in-from-right-4 duration-300">
                            {(Object.entries(PASS_META) as [PassType, typeof PASS_META[PassType]][]).map(([t, m]) => (
                                <Button
                                    key={t}
                                    variant={passType === t ? "default" : "outline"}
                                    onClick={() => {
                                        setPassType(t);
                                        setSelectedZone("all");
                                        setSelectedSchool("all");
                                        setSelectedClass("all");
                                        setShowSwitcher(false);
                                    }}
                                    className={`h-10 rounded-xl font-normal uppercase text-[10px] tracking-widest transition-all
                                        ${passType === t
                                            ? `${m.bg} hover:opacity-90 text-white shadow-lg shadow-${m.bg.replace('bg-', '')}/20`
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span className="ml-2">{m.plural}</span>
                                </Button>
                            ))}
                            <Button
                                variant="ghost"
                                onClick={() => setShowSwitcher(false)}
                                className="h-10 w-10 p-0 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            >
                                <X size={18} />
                            </Button>
                        </div>
                    )}
                </div>
            </div>


            {/* ── MAIN SECTION ──────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left controls */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Full batch export */}
                    <Card className="apc-card border-none bg-slate-900 rounded-[28px] overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-56 h-56 ${meta.bg} blur-[100px] opacity-25 pointer-events-none`} />
                        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                            <div className="flex-grow">
                                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Batch Export</p>
                                <h3 className="text-xl font-black text-white">Download All {meta.plural}</h3>
                                <p className="text-slate-400 text-sm mt-1">
                                    {filteredData.length} pass{filteredData.length !== 1 ? 'es' : ''} ready for export.
                                </p>
                            </div>
                            <Button
                                onClick={() => handleExport('all')}
                                className="shrink-0 h-14 px-8 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black uppercase tracking-widest text-[10px] group active:scale-95 transition-all shadow-xl"
                            >
                                Export {filteredData.length} Passes
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Filters grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* Zone filter — all types */}
                        <Card className="apc-card border border-slate-100 rounded-[24px] p-6 space-y-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                    <School size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Zone Filter</h4>
                                    <p className="text-[10px] text-slate-400">Export by geographic zone</p>
                                </div>
                            </div>
                            <Select value={selectedZone} onValueChange={setSelectedZone}>
                                <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-none px-4 font-medium text-sm">
                                    <SelectValue placeholder="Select Zone" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl shadow-xl">
                                    <SelectItem value="all">All Zones</SelectItem>
                                    {Array.from(new Set((activeData as any[]).map(r => r.zone).filter(Boolean))).sort().map(z => (
                                        <SelectItem key={String(z)} value={String(z)}>{String(z)}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button onClick={() => handleExport('zone')} className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-widest text-[10px]">
                                Export Zone Passes
                            </Button>
                        </Card>

                        {/* School filter — students, guardians, qiraath */}
                        {(passType === 'student' || passType === 'guardian' || passType === 'qiraath') && (
                            <Card className="apc-card border border-slate-100 rounded-[24px] p-6 space-y-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <School size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">School Filter</h4>
                                        <p className="text-[10px] text-slate-400">Export by institution</p>
                                    </div>
                                </div>
                                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                                    <SelectTrigger className="w-full h-auto min-h-[2.75rem] py-2 rounded-xl bg-slate-50 border-none px-4 font-medium text-sm [&>span]:line-clamp-none [&>span]:whitespace-normal [&>span]:text-left">
                                        <SelectValue placeholder="Select School" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-xl">
                                        <SelectItem value="all">All Schools</SelectItem>
                                        {Array.from(new Set((activeData as any[]).map(r => r.school))).sort().map(s => (
                                            <SelectItem key={s} value={s}>
                                                <div className="whitespace-normal break-words text-xs leading-snug py-0.5">{getSchoolName(s)}</div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => handleExport('school')} className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-widest text-[10px]">
                                    Export School Passes
                                </Button>
                            </Card>
                        )}

                        {/* Class filter — students, guardians, qiraath */}
                        {(passType === 'student' || passType === 'guardian' || passType === 'qiraath') && (
                            <Card className="apc-card border border-slate-100 rounded-[24px] p-6 space-y-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                        <Archive size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Grade Filter</h4>
                                        <p className="text-[10px] text-slate-400">Export by class / grade</p>
                                    </div>
                                </div>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="w-full h-11 rounded-xl bg-slate-50 border-none px-4 font-medium text-sm">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-xl">
                                        <SelectItem value="all">All Grades</SelectItem>
                                        {["3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"].filter(c =>
                                            (activeData as any[]).some(r => r.className === c)
                                        ).map(c => (
                                            <SelectItem key={c} value={c}>Grade {c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => handleExport('class')} className="w-full h-10 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold uppercase tracking-widest text-[10px]">
                                    Export Grade Passes
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Right: Live preview */}
                <div className="lg:col-span-5 apc-card">
                    {/* Dark stage / spotlight backdrop */}
                    <div className="bg-slate-950 rounded-[28px] p-8 flex flex-col items-center gap-6 sticky top-8">
                        <div className="flex items-center gap-2 w-full">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Preview</p>
                            <span className={`ml-auto text-[10px] font-black uppercase tracking-widest ${meta.color}`}>
                                {meta.plural}
                            </span>
                        </div>

                        {/* Glowing halo behind the pass card */}
                        <div className="relative w-full max-w-[220px]">
                            <div className={`absolute -inset-8 ${meta.bg} blur-3xl opacity-20 rounded-full`} />
                            <div className="relative">
                                <AccessPassDesign
                                    registration={previewReg}
                                    passType={passType}
                                    customLocations={dynamicLocations}
                                />
                            </div>
                        </div>

                        <div className="text-center space-y-1">
                            <p className="text-slate-500 text-[10px] font-semibold">
                                Showing {previewReg
                                    ? (passType === 'student' ? previewReg.studentName : passType === 'guardian' ? previewReg.guardianName : previewReg.name)
                                    : 'no data yet'}
                            </p>
                            <p className="text-slate-600 text-[9px] uppercase tracking-widest">
                                {filteredData.length} pass{filteredData.length !== 1 ? 'es' : ''} in current selection
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
